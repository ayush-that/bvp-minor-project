import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Mail, Lock } from "lucide-react";
import type { EmailTemplate } from "@/types";

export default function PublicEmails() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  // Fallback demo content when DB has no public templates
  const FAKE_EMAILS: EmailTemplate[] = [
    {
      id: "fake-1",
      title: "Short value-first internship reachout",
      description:
        "Quick intro + 1-liner value. Perfect for cold outreach to founders.",
      template_content:
        "Subject: Exploring ways I can help at {StartupName}\nHi {FirstName}, I’m {YourName}, a {YourRole}. I saw your work on {TheirThing} and loved {SpecificDetail}. I can help with {ValueYouProvide} – happy to share a tiny demo if helpful.",
      category: "internship",
      status: "active",
      usage_count: 0,
      success_rate: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "fake-2",
      title: "Follow-up after no reply (friendly)",
      description: "Polite nudge that adds value instead of asking for time.",
      template_content:
        "Subject: Quick nudge + tiny example\nHi {FirstName}, looping back in case this got buried. I put together a 1-page {ThingYouMade} to show exactly how I can help with {TheirGoal}. If not useful, all good – happy to iterate.",
      category: "follow-up",
      status: "active",
      usage_count: 0,
      success_rate: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "fake-3",
      title: "Founder value pitch (specific and short)",
      description: "Lead with proof of work, ask for feedback, not a call.",
      template_content:
        "Subject: 48h mock for {StartupName}\nHi {FirstName}, I built a small {Prototype/Analysis} for {StartupName} – focused on {SpecificMetric}. Took ~48h. If this direction is useful, happy to refine based on your feedback.",
      category: "value-pitch",
      status: "active",
      usage_count: 0,
      success_rate: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Skip database, just use hardcoded templates
        setTemplates(FAKE_EMAILS);
      } catch (e) {
        console.error(e);
        setTemplates(FAKE_EMAILS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = templates;

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Pathfinder | Email Templates</title>
        <meta
          name="description"
          content="Explore high-signal outreach templates. Sign in to customize and use full versions."
        />
        <meta property="og:title" content="Pathfinder | Email Templates" />
        <meta
          property="og:description"
          content="Explore high-signal outreach templates. Sign in to customize and use full versions."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/emails`} />
        <meta
          property="og:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pathfinder | Email Templates" />
        <meta
          name="twitter:description"
          content="Explore high-signal outreach templates. Sign in to customize and use full versions."
        />
        <meta
          name="twitter:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <link rel="canonical" href={`${window.location.origin}/emails`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${window.location.origin}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Emails",
                item: `${window.location.origin}/emails`,
              },
            ],
          })}
        </script>
      </Helmet>

      <PageHeader
        icon={Mail}
        title="Email Templates"
        description="Preview opening lines — sign in to access full templates and tools"
      />

      {/* removed search and inline login per request */}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-none border-foreground/10">
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
        <Card className="rounded-none border-foreground/10">
          <CardContent className="p-8 text-center text-muted-foreground">
            No templates found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card
              key={t.id}
              className="group transition-all flex flex-col cursor-pointer rounded-none border border-foreground/10 hover:shadow-lg bg-gradient-to-b from-background to-background/70"
              onClick={() => setSelectedTitle(t.title)}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm truncate group-hover:text-primary transition-colors">
                      {t.title}
                    </CardTitle>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-primary/10 text-primary whitespace-nowrap">
                    {(t.category || "").replace("-", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed bg-foreground/5/50 rounded-md p-3 min-h-[110px]">
                  {
                    (
                      t.template_content ||
                      "Opening line hidden. Click to preview and login."
                    ).split("\n")[0]
                  }
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedTitle}
        onOpenChange={() => setSelectedTitle(null)}>
        <DialogContent className="sm:max-w-xl border border-foreground/10 bg-white dark:bg-background text-foreground shadow-2xl rounded-none p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </span>
              {selectedTitle}
            </DialogTitle>
            <DialogClose onClose={() => setSelectedTitle(null)} />
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <div className="relative rounded-none border border-foreground/10 bg-white dark:bg-background p-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-12 text-muted-foreground">From</span>
                  <div className="h-3 w-40 rounded bg-foreground/10 blur-[1px]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-muted-foreground">To</span>
                  <div className="h-3 w-44 rounded bg-foreground/10 blur-[1px]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-muted-foreground">Subject</span>
                  <div className="h-3 w-56 rounded bg-foreground/10 blur-[1px]" />
                </div>
              </div>
              <div className="mt-4 h-40 rounded-none bg-foreground/5 blur-sm" />
              <p className="text-xs text-muted-foreground mt-3">
                Sign in to view the full template and tools
              </p>
            </div>
          </div>
          <div className="px-6 py-4 border-t flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setSelectedTitle(null)}>
              Close
            </Button>
            <Button asChild>
              <a
                href="/sign-in?auto=1&redirectTo=%2Fapp"
                className="inline-flex items-center gap-1">
                <Lock className="h-4 w-4" /> Login to view
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
