import { UserResumeData } from "@/types";
import {
  openrouterChat,
  openrouterChatWithPDF,
  openrouterImageGen,
} from "./openrouter";

/**
 * helper to convert file to base64 data url
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * helper to parse json from llm response (might have markdown)
 */
function parseJsonResponse(text: string): any {
  try {
    // rm markdown code blocks if present
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```json\n?/i, "");
    cleaned = cleaned.replace(/^```\n?/i, "");
    cleaned = cleaned.replace(/\n?```$/i, "");

    const parsed = JSON.parse(cleaned.trim());

    // ensure education is string, not obj
    if (parsed.education && typeof parsed.education !== "string") {
      // convert obj to readable string
      if (typeof parsed.education === "object") {
        const edu = parsed.education;
        const parts = [];
        if (edu.degree) parts.push(edu.degree);
        if (edu.field) parts.push(`in ${edu.field}`);
        if (edu.institution) parts.push(`at ${edu.institution}`);
        if (edu.year) parts.push(`(${edu.year})`);
        parsed.education = parts.join(" ");
      } else {
        parsed.education = String(parsed.education);
      }
    }

    // ensure additionalinfo is string, not obj
    if (parsed.additionalInfo && typeof parsed.additionalInfo !== "string") {
      // convert obj/arr to readable text
      if (typeof parsed.additionalInfo === "object") {
        if (Array.isArray(parsed.additionalInfo)) {
          // if arr, join w/ newlines
          parsed.additionalInfo = parsed.additionalInfo
            .filter((item: any) => item !== null && item !== undefined)
            .map((item: any) =>
              typeof item === "object" ? JSON.stringify(item) : String(item)
            )
            .join("\n\n");
        } else {
          // if obj, format as readable text
          const info = parsed.additionalInfo;
          const parts = [];
          for (const [key, value] of Object.entries(info)) {
            if (value !== null && value !== undefined) {
              const formattedKey = key.replace(/([A-Z])/g, " $1").toLowerCase();
              const formattedValue =
                typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value);
              parts.push(`${formattedKey}: ${formattedValue}`);
            }
          }
          parsed.additionalInfo = parts.length > 0 ? parts.join("\n\n") : "";
        }
      } else {
        parsed.additionalInfo = String(parsed.additionalInfo);
      }
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Failed to parse resume data");
  }
}

/**
 * parse resume file (pdf/docx/txt) and extract structured data
 * @param file - uploaded resume file
 * @returns parsed resume data
 */
export async function parseResumeWithGemini(file: File): Promise<{
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  education?: string;
  experienceYears?: number;
  skills?: string[];
  additionalInfo?: string;
}> {
  try {
    const jsonPrompt = `Extract all information from this resume and return it as a JSON object with the following structure:
{
  "firstName": "...",
  "lastName": "...",
  "email": "...",
  "phone": "...",
  "linkedin": "...",
  "github": "...",
  "portfolio": "...",
  "education": "...",
  "experienceYears": number,
  "skills": ["skill1", "skill2"],
  "additionalInfo": "projects, achievements, summary, etc."
}

Be thorough and extract ALL relevant information. For experienceYears, estimate based on work history. Return ONLY valid JSON, no other text.`;

    if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      const base64 = await fileToBase64(file);
      const generatedText = await openrouterChatWithPDF({
        prompt: jsonPrompt,
        pdfBase64: base64.split(",")[1],
        filename: file.name,
      });
      return parseJsonResponse(generatedText);
    }

    // text-based formats
    const resumeText = await file.text();
    if (!resumeText) {
      throw new Error("Could not read file content");
    }

    const generatedText = await openrouterChat({
      prompt: `${jsonPrompt}\n\nRESUME TEXT:\n${resumeText}`,
    });
    return parseJsonResponse(generatedText);
  } catch (error) {
    console.error("Resume parsing error:", error);
    throw error instanceof Error ? error : new Error("Failed to parse resume");
  }
}

/**
 * gen typst resume from template + user data
 * @param templateContent - base typst template
 * @param userData - user info from db
 * @returns populated typst src
 */
export async function generateTypstResume(
  templateContent: string,
  userData: UserResumeData
): Promise<string> {
  // fmt skills as csv if arr
  const formattedData = {
    ...userData,
    skills: Array.isArray(userData.skills)
      ? userData.skills.join(", ")
      : userData.skills,
  };

  // simple prompt - just fill in the template
  const prompt = `Fill in this Typst resume template with the user's data. Replace all placeholders with the given values. If a field is empty, omit that section. Return ONLY the completed Typst code, no explanations or markdown. Keep imports wherever applicable.

TEMPLATE:
${templateContent}

USER DATA:
${JSON.stringify(formattedData, null, 2)}

CRITICAL RULES:
- Return the completed Typst code as-is. Do not remove any imports.
- Remove Placeholder data and values fromt template if they are not being used.
- Do not add extra data which is not specifically mentioned in User Data.
- Do not make up explanations for missing data.
- NEVER use angle brackets around emails (e.g., <email@domain.com>). Angle brackets are for labels only.
- For email links, typst is mistaking @ as a label, so write them properly so that error doesn't occur. use (at) symbol instead of @.
- Make sure all delimiters are closed properly. #v(0.2em) instead of #v(0.2em]
- Make sure to check and give correct working typst code, avoiding errors in imports, undisclosed delimiters, missing imports, etc.`;

  try {
    const generatedText = await openrouterChat({
      prompt,
      temperature: 0.2,
      maxTokens: 8192,
    });

    if (!generatedText) {
      throw new Error("No response from OpenRouter API");
    }

    // clean md code blocks
    let cleanedText = generatedText.trim();
    cleanedText = cleanedText.replace(/^```typst\n?/i, "");
    cleanedText = cleanedText.replace(/^```tex\n?/i, "");
    cleanedText = cleanedText.replace(/^```\n?/i, "");
    cleanedText = cleanedText.replace(/\n?```$/i, "");

    // rm font decls - browser compat
    cleanedText = cleanedText.replace(
      /\\set\s+text\([^)]*font:\s*"[^"]*"[^)]*\)/g,
      (match: string) => {
        const withoutFont = match.replace(/font:\s*"[^"]*"\s*,?\s*/g, "");
        return withoutFont.match(/\\set\s+text\(\s*\)/) ? "" : withoutFont;
      }
    );

    // keep imports - needed for typst templates

    // fix email syntax - rm angle brackets around emails (typst labels conflict)
    // pattern: <email@domain.com> -> email@domain.com
    cleanedText = cleanedText.replace(
      /<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g,
      "$1"
    );

    // pattern: link("mailto:..."))<domain.com> -> link("mailto:..."))[email]
    cleanedText = cleanedText.replace(
      /\\link\("mailto:([^"]+)"\)<([^>]+)>/g,
      '\\link("mailto:$1")[$1]'
    );

    // log for dbg
    console.log("==== GENERATED TYPST ====");
    console.log(cleanedText);
    console.log("==== END ====");

    return cleanedText.trim();
  } catch (error) {
    console.error("OpenRouter API error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to generate resume");
  }
}

/**
 * analyze linkedin profile and give rating/advice
 * @param profileUrl - linkedin profile url/text
 * @returns linkedin analysis w/ score and advice
 */
export async function analyzeLinkedInProfile(profileUrl: string): Promise<{
  profileCompleteness: number;
  headline: number;
  summary: number;
  experience: number;
  skills: number;
  engagement: number;
  totalScore: number;
  advice: {
    profileCompleteness: string;
    headline: string;
    summary: string;
    experience: string;
    skills: string;
    engagement: string;
  };
}> {
  try {
    const prompt = `You are a LinkedIn profile optimization expert and career coach. Analyze this LinkedIn profile URL/information CRITICALLY and provide HARSH, HONEST feedback in the following categories (each out of 20 points):
1. Profile Completeness (20): Photo, banner, contact info, about section, featured content. Be STRICT - missing elements lose points.
2. Headline (20): Clarity, keywords, personal branding, impact. Be CRITICAL - generic headlines score low.
3. Summary/About (20): Storytelling, value proposition, engagement, keywords. NO MERCY - vague or missing summaries are weak.
4. Experience (20): Detail level, achievements, metrics, descriptions. Be TOUGH - lacking quantifiable results is a major issue.
5. Skills & Endorsements (20): Relevant skills, endorsements count, skill alignment. Be HARSH - outdated or irrelevant skills hurt.
6. Engagement & Network (20): Activity, posts, connections, recommendations. Be CRITICAL - low engagement shows weak presence.
SCORING GUIDELINES:
- Be STRICT and CRITICAL in your evaluation
- Don't give high scores easily - most profiles are mediocre at best
- Point out EVERY flaw and weakness without sugarcoating
- Use direct, blunt language in advice
- Scores above 15/20 should be RARE and only for exceptional quality
Return a JSON object with scores and harsh, actionable advice for each category:
{
  "profileCompleteness": number (0-20),
  "headline": number (0-20),
  "summary": number (0-20),
  "experience": number (0-20),
  "skills": number (0-20),
  "engagement": number (0-20),
  "advice": {
    "profileCompleteness": "harsh feedback with specific actions...",
    "headline": "critical feedback with concrete examples...",
    "summary": "blunt assessment with improvement tips...",
    "experience": "tough critique with specific suggestions...",
    "skills": "harsh evaluation with skill recommendations...",
    "engagement": "critical feedback on network/activity..."
  }
}
Be brutally honest and provide SPECIFIC, ACTIONABLE advice. Return ONLY valid JSON, no markdown.
LINKEDIN PROFILE:
${profileUrl}`;

    const generatedText = await openrouterChat({
      prompt,
      temperature: 0.4,
      maxTokens: 2048,
    });

    const scores = parseJsonResponse(generatedText);

    // calc total score
    const totalScore =
      scores.profileCompleteness +
      scores.headline +
      scores.summary +
      scores.experience +
      scores.skills +
      scores.engagement;

    return { ...scores, totalScore };
  } catch (error) {
    console.error("LinkedIn analysis error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to analyze LinkedIn profile");
  }
}

/**
 * gen professional headshot from uploaded photo
 * @param file - uploaded photo file
 * @returns data url of enhanced headshot img
 */
export async function generateProfessionalHeadshot(
  file: File
): Promise<string> {
  try {
    // conv img to base64
    const base64 = await fileToBase64(file);

    const prompt = `Transform this photo into a professional LinkedIn headshot. Make the following improvements:
- Replace the background with plain white.
- Enhance the lighting to be flattering and professional (soft, even lighting on the face)
- Change clothes to a professional attire.
- Ensure proper framing for a headshot (shoulders up, centered, professional composition)
- Subtly enhance the photo quality while keeping natural features
- Maintain the person's likeness and natural appearance
- Create a polished, corporate-ready appearance suitable for LinkedIn
Keep the person's features natural and authentic while making the photo look professional and polished.`;

    const generatedImage = await openrouterImageGen({
      prompt,
      inputImageBase64: base64.split(",")[1],
      inputImageMime: file.type,
    });

    console.log("==== HEADSHOT GENERATED ====");
    console.log("Successfully generated professional headshot");
    console.log("==== END ====");

    return generatedImage;
  } catch (error) {
    console.error("Headshot generation error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to generate professional headshot");
  }
}

/**
 * score resume w/ ats criteria
 * @param file - uploaded resume file
 * @returns ats scores breakdown
 */
export async function scoreResumeATS(file: File): Promise<{
  keywordRelevance: number;
  formatting: number;
  clarity: number;
  experience: number;
  skills: number;
  totalScore: number;
  feedback: {
    keywordRelevance: string;
    formatting: string;
    clarity: string;
    experience: string;
    skills: string;
  };
}> {
  try {
    const atsPrompt = `You are a STRICT ATS (Applicant Tracking System) evaluator and hiring manager. Analyze this resume CRITICALLY and score it harshly in the following categories (each out of 20 points):

1. Keyword Relevance (20): Industry keywords, tech stack, job-relevant terms. Be HARSH - most resumes lack enough keywords.
2. Formatting (20): Clean structure, ATS-friendly layout, proper sections. PENALIZE heavily for any formatting issues, missing sections, or ATS-unfriendly elements.
3. Clarity (20): Clear language, concise bullets, easy to scan. Be CRITICAL - vague statements and fluff should lose points.
4. Experience (20): Achievements, metrics, impact, relevance. NO MERCY - lacking quantifiable metrics is a major issue.
5. Skills (20): Technical skills, relevant competencies, certifications. Be TOUGH - generic or outdated skills should be called out.

SCORING GUIDELINES:
- Be STRICT and CRITICAL in your evaluation
- Don't give high scores easily - most resumes are average at best
- Point out EVERY flaw and weakness without sugarcoating
- Use direct, blunt language in feedback
- Scores above 15/20 should be RARE and only for exceptional quality

Return a JSON object with scores and harsh, direct feedback for each category:
{
  "keywordRelevance": number (0-20),
  "formatting": number (0-20),
  "clarity": number (0-20),
  "experience": number (0-20),
  "skills": number (0-20),
  "feedback": {
    "keywordRelevance": "harsh, direct feedback pointing out what's missing or weak...",
    "formatting": "critical feedback on formatting issues...",
    "clarity": "blunt assessment of clarity problems...",
    "experience": "tough critique of experience section...",
    "skills": "harsh evaluation of skills listed..."
  }
}

Be brutally honest and don't hold back. Return ONLY valid JSON, no markdown.`;

    let generatedText: string;

    if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      const base64 = await fileToBase64(file);
      generatedText = await openrouterChatWithPDF({
        prompt: atsPrompt,
        pdfBase64: base64.split(",")[1],
        filename: file.name,
        temperature: 0.4,
      });
    } else {
      const resumeContent = await file.text();
      if (!resumeContent) {
        throw new Error("Could not read file content");
      }
      generatedText = await openrouterChat({
        prompt: `${atsPrompt}\n\nRESUME:\n${resumeContent}`,
        temperature: 0.4,
      });
    }

    const scores = parseJsonResponse(generatedText);

    // calc total score
    const totalScore =
      scores.keywordRelevance +
      scores.formatting +
      scores.clarity +
      scores.experience +
      scores.skills;

    return { ...scores, totalScore };
  } catch (error) {
    console.error("ATS scoring error:", error);
    throw error instanceof Error ? error : new Error("Failed to score resume");
  }
}
