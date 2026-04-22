const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * text-only chat completion via openrouter
 */
export async function openrouterChat(opts: {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  if (!API_KEY) {
    throw new Error("OpenRouter API key not configured (VITE_OPENROUTER_API_KEY)");
  }

  const {
    prompt,
    model = "google/gemini-2.5-flash-lite",
    temperature = 0.3,
    maxTokens = 2048,
  } = opts;

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices[0].message.content as string;
}

/**
 * multimodal chat completion with an inline PDF via openrouter
 */
export async function openrouterChatWithPDF(opts: {
  prompt: string;
  pdfBase64: string;       // without "data:...;base64," prefix
  filename?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  if (!API_KEY) {
    throw new Error("OpenRouter API key not configured (VITE_OPENROUTER_API_KEY)");
  }

  const {
    prompt,
    pdfBase64,
    filename = "resume.pdf",
    model = "google/gemini-2.5-flash-lite",
    temperature = 0.3,
    maxTokens = 2048,
  } = opts;

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "file",
              file: {
                filename,
                file_data: `data:application/pdf;base64,${pdfBase64}`,
              },
            },
          ],
        },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices[0].message.content as string;
}

/**
 * image generation via openrouter — returns a data URL
 */
export async function openrouterImageGen(opts: {
  prompt: string;
  inputImageBase64: string;   // without data URL prefix
  inputImageMime: string;     // e.g. "image/jpeg"
  model?: string;
}): Promise<string> {
  if (!API_KEY) {
    throw new Error("OpenRouter API key not configured (VITE_OPENROUTER_API_KEY)");
  }

  const {
    prompt,
    inputImageBase64,
    inputImageMime,
    model = "google/gemini-2.5-flash-image-preview",
  } = opts;

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${inputImageMime};base64,${inputImageBase64}`,
              },
            },
          ],
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${body}`);
  }

  const data = await res.json();

  const images: Array<{ type: string; image_url: { url: string } }> =
    data.choices[0].message.images;

  if (!images || images.length === 0) {
    throw new Error("No image returned in OpenRouter response");
  }

  return images[0].image_url.url;
}
