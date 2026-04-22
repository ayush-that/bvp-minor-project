import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomEmailTemplateModal } from "@/components/CustomEmailTemplateModal";
import type { EmailTemplate } from "@/types";
import { Mail, Search } from "lucide-react";

type Category = "all" | "internship" | "follow-up";

export function EmailTracker() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EmailTemplate | null>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);

      // Hardcoded templates - always available
      const HARDCODED_TEMPLATES: EmailTemplate[] = [
        {
          id: "template-1",
          title: "Cold outreach to founders",
          description: "Direct and value-focused first message",
          template_content:
            "Subject: Quick idea for {StartupName}\n\nHi {FirstName},\n\nI'm {YourName}, currently at {YourSchool/Company}. Been following {StartupName}'s work on {TheirProduct} — really impressed by {SpecificFeature}.\n\nI specialize in {YourSkill} and noticed you might benefit from {ValueProposition}. Built something similar for {PreviousProject} that resulted in {Metric}.\n\nHappy to share a quick demo or prototype if you're interested.\n\nBest,\n{YourName}",
          category: "internship",
          status: "active",
          usage_count: 0,
          success_rate: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "template-2",
          title: "Follow-up after no response",
          description: "Gentle nudge with added value",
          template_content:
            "Subject: Re: Quick idea for {StartupName}\n\nHi {FirstName},\n\nFollowing up on my previous email. I put together a quick {Mockup/Analysis/Prototype} showing how {YourSolution} could help with {TheirProblem}.\n\nTakes 2 minutes to review: {Link}\n\nNo pressure if timing isn't right — just wanted to share.\n\n{YourName}",
          category: "follow-up",
          status: "active",
          usage_count: 0,
          success_rate: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "template-3",
          title: "Internship inquiry",
          description: "Professional internship application",
          template_content:
            "Subject: Internship Application - {YourRole} at {StartupName}\n\nHi {FirstName},\n\nI'm {YourName}, a {Year} year {Major} student at {University}. I'm reaching out about potential internship opportunities at {StartupName}.\n\nMy experience includes:\n• {Skill1} - {Project1}\n• {Skill2} - {Project2}\n• {Skill3} - {Project3}\n\nI'm particularly excited about {StartupName}'s mission to {TheirMission}. I believe my background in {YourExpertise} could contribute to {SpecificGoal}.\n\nWould love to discuss how I can add value to your team.\n\nResume attached. Available to start {StartDate}.\n\nBest regards,\n{YourName}\n{LinkedIn}\n{Portfolio}",
          category: "internship",
          status: "active",
          usage_count: 0,
          success_rate: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "template-4",
          title: "Value-first approach",
          description: "Lead with what you can offer",
          template_content:
            "Subject: 48h project for {StartupName}\n\nHi {FirstName},\n\nSpent the weekend building a {ToolType} for {StartupName}. Thought you might find it useful.\n\n{LinkToDemo}\n\nKey features:\n✓ {Feature1}\n✓ {Feature2}\n✓ {Feature3}\n\nFeel free to use it however you'd like. If you'd like me to refine it or build something else, I'm available for {Duration}.\n\nCheers,\n{YourName}",
          category: "internship",
          status: "active",
          usage_count: 0,
          success_rate: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "template-5",
          title: "Networking follow-up",
          description: "After meeting at event or referral",
          template_content:
            "Subject: Great meeting you at {Event}\n\nHi {FirstName},\n\nReally enjoyed our conversation about {Topic} at {Event} yesterday. Your insights on {SpecificPoint} were particularly interesting.\n\nAs I mentioned, I'd love to contribute to {StartupName}. Given our discussion about {TheirChallenge}, I think my experience with {YourSkill} could be relevant.\n\nWould you be open to a quick call to explore this further?\n\nBest,\n{YourName}",
          category: "follow-up",
          status: "active",
          usage_count: 0,
          success_rate: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "template-6",
          title: "Final follow-up",
          description: "Last attempt to get a response",
          template_content:
            "Subject: Last follow-up - {StartupName} opportunity\n\nHi {FirstName},\n\nI know you're busy, so this will be my last email.\n\nStill very interested in contributing to {StartupName}. My offer to help with {SpecificArea} stands.\n\nIf timing isn't right, totally understand. Happy to reconnect in a few months.\n\nBest of luck with {TheirGoal}!\n\n{YourName}",
          category: "follow-up",
          status: "active",
          usage_count: 0,
          success_rate: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setTemplates(HARDCODED_TEMPLATES);
    } catch (e) {
      console.error("Failed to load templates", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();

    // refresh templates when window regains focus to show updated usage counts
    const handleFocus = () => {
      loadTemplates();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesCat = category === "all" || t.category === category;
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.template_content || "").toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [templates, category, query]);

  const capitalizeTitle = (title: string): string => {
    return title.replace(/\b\w/g, (char: string) => char.toUpperCase());
  };

  return (
    <div>
      <PageHeader
        icon={Mail}
        title="Email Templates"
        description="Curated, high-signal outreach templates for internships and follow-ups"
      />

      {/* Controls */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-3">
          <div className="flex gap-2">
            {(
              [
                { id: "all", label: "All" },
                { id: "internship", label: "Internship" },
                { id: "follow-up", label: "Follow-up" },
              ] as { id: Category; label: string }[]
            ).map((opt) => (
              <Button
                key={opt.id}
                variant={category === opt.id ? "default" : "outline"}
                size="sm"
                className={
                  category === opt.id
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                    : "hover:bg-primary/10 hover:text-primary hover:border-primary"
                }
                onClick={() => setCategory(opt.id)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="w-full sm:w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
            <Input
              placeholder="Search templates..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-40 bg-foreground/10 rounded mb-2" />
                <div className="h-3 w-60 bg-foreground/10 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-24 w-full bg-foreground/10 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No templates found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.id} className="group transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm truncate">
                      {capitalizeTitle(t.title)}
                    </CardTitle>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-foreground/10 text-foreground/70 whitespace-nowrap"
                  >
                    {(t.category || "").replace("-", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed bg-foreground/5 rounded-md p-3 min-h-[110px]">
                  {t.template_content.slice(0, 320)}
                  {t.template_content.length > 320 ? "…" : ""}
                </pre>
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      navigator.clipboard.writeText(t.template_content)
                    }
                  >
                    Copy
                  </Button>
                  <Button className="flex-1" onClick={() => setSelected(t)}>
                    Customize
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <CustomEmailTemplateModal
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          template={selected}
          onTemplateUsed={loadTemplates}
        />
      )}
    </div>
  );
}
