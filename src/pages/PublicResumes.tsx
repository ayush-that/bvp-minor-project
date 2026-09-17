import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase";
import type { ResumeTemplate } from "@/types";

export default function PublicResumes() {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoadingTemplates(true);
        const { data, error } = await supabase
          .from("resume_templates")
          .select("*")
          .eq("is_active", true)
          .order("usage_count", { ascending: false })
          .limit(12);
        if (error) throw error;
        setTemplates(data || []);
      } catch (e) {
        console.error(e);
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    })();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Pathfinder | AI Resume Templates</title>
        <meta
          name="description"
          content="Preview AI-powered resume templates. Sign in to generate and download your resume."
        />
        <meta property="og:title" content="Pathfinder | AI Resume Templates" />
        <meta
          property="og:description"
          content="Preview AI-powered resume templates. Sign in to generate and download your resume."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/resumes`} />
        <meta
          property="og:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pathfinder | AI Resume Templates" />
        <meta
          name="twitter:description"
          content="Preview AI-powered resume templates. Sign in to generate and download your resume."
        />
        <meta
          name="twitter:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <link rel="canonical" href={`${window.location.origin}/resumes`} />
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
                name: "Resumes",
                item: `${window.location.origin}/resumes`,
              },
            ],
          })}
        </script>
      </Helmet>

      <PageHeader
        title="AI Resume Templates"
        description="Explore templates — sign in to generate your resume"
        icon={Sparkles}
      />

      {loadingTemplates ? (
        <div className="flex justify-start py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-left py-8 text-muted-foreground">
          <p>No templates available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="h-full group transition-all cursor-default rounded-none border border-foreground/10 hover:shadow-lg">
              <CardContent className="pt-1 space-y-3 h-full flex flex-col">
                {template.preview_image_url && (
                  <div className="aspect-[8.5/11] bg-foreground/5 rounded-md overflow-hidden">
                    <img
                      src={template.preview_image_url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between flex-row w-full mb-2">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {template.category}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  )}
                </div>
                <Button size="sm" className="w-full mt-auto" disabled>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Sign in to Generate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-foreground/10 bg-foreground/5 px-4 py-3">
          <p className="text-sm text-foreground/80">
            Ready to create your resume?
          </p>
          <a href="/sign-in?auto=1&redirectTo=%2Fapp" className="inline-flex">
            <Button size="sm" className="">
              Sign in to Generate
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
