import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Building2, Lock } from "lucide-react";
import { supabase } from "@/utils/supabase";
import type { Startup } from "@/types";

export default function PublicStartups() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Startup | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("startups")
          .select("*, startup_tags (tag)")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        const formatted: Startup[] =
          data?.map((s: any) => ({
            ...s,
            tags: s.startup_tags?.map((t: any) => t.tag) || [],
          })) || [];
        setStartups(formatted);
      } catch (e) {
        console.error(e);
        setStartups([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = startups.slice(0, 15);
  const hasMore = startups.length > 15;

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Pathfinder | Startups</title>
        <meta
          name="description"
          content="Browse a curated list of startups. Sign in to see complete details, team, and unlimited results."
        />
        <meta property="og:title" content="Pathfinder | Startups" />
        <meta
          property="og:description"
          content="Browse a curated list of startups. Sign in to see complete details, team, and unlimited results."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`${window.location.origin}/startups`}
        />
        <meta
          property="og:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pathfinder | Startups" />
        <meta
          name="twitter:description"
          content="Browse a curated list of startups. Sign in to see complete details, team, and unlimited results."
        />
        <meta
          name="twitter:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <link rel="canonical" href={`${window.location.origin}/startups`} />
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
                name: "Startups",
                item: `${window.location.origin}/startups`,
              },
            ],
          })}
        </script>
      </Helmet>

      <PageHeader
        title="Startups"
        description="A quick peek at our startup database — sign in to explore all details"
        icon={Building2}
      />

      {/* removed search and inline login per request */}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 rounded-none border-foreground/10">
              <div className="h-4 w-40 bg-foreground/10 rounded mb-2" />
              <div className="h-3 w-60 bg-foreground/10 rounded" />
            </Card>
          ))
        ) : visible.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground col-span-full rounded-none border-foreground/10">
            No startups found
          </Card>
        ) : (
          <>
            {visible.map((s) => (
              <Card
                key={s.id}
                onClick={async () => {
                  setSelected(s);
                  try {
                    const { data: current, error: currErr } = await supabase
                      .from("startups")
                      .select("views_count")
                      .eq("id", s.id)
                      .single();
                    if (!currErr) {
                      const newCount = (current?.views_count || 0) + 1;
                      await supabase
                        .from("startups")
                        .update({ views_count: newCount })
                        .eq("id", s.id);
                    }
                  } catch {}
                }}
                className="group transition-all cursor-pointer hover:shadow-lg rounded-none border border-foreground/10 bg-gradient-to-b from-background to-background/70">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded bg-foreground/10 overflow-hidden flex items-center justify-center">
                      {s.logo_url ? (
                        <img
                          src={s.logo_url}
                          alt={`${s.name} logo`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xs font-semibold">
                          {s.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {s.name}
                    </h3>
                  </div>
                  <p className="text-xs text-foreground/60 line-clamp-2">
                    {(s.description || "No description available").slice(
                      0,
                      160
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                    {(s.tags || [])
                      .slice(0, 2)
                      .map((tag: string, i: number) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-[10px] bg-primary/10 text-primary">
                          {tag}
                        </Badge>
                      ))}
                  </div>
                </div>
              </Card>
            ))}
            {hasMore && (
              <Card className="p-0 rounded-none overflow-hidden border border-foreground/10 relative group col-span-full">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4 opacity-60 blur-[1.5px] select-none pointer-events-none">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-md bg-foreground/10" />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-3 p-6 rounded-none border border-foreground/10 bg-background/80 backdrop-blur-xl shadow-md">
                    <p className="text-sm text-muted-foreground">
                      Unlock everything
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                      200+ startups waiting for you
                    </p>
                    <Button asChild>
                      <a
                        href="/sign-in?auto=1&redirectTo=%2Fapp"
                        className="inline-flex items-center gap-2">
                        <Lock className="h-4 w-4" /> Login to explore
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* modal for CTA with blur preview */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-xl border border-foreground/10 bg-white dark:bg-background text-foreground shadow-2xl rounded-none p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-7 w-7 rounded-md bg-primary/10 text-primary overflow-hidden items-center justify-center">
                {selected?.logo_url ? (
                  <img
                    src={selected.logo_url}
                    alt="logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold">
                    {selected?.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </span>
              {selected?.name}
            </DialogTitle>
            <DialogClose onClose={() => setSelected(null)} />
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <div className="rounded-none border border-foreground/10 bg-white dark:bg-background p-4">
              <div className="h-40 w-full rounded-none bg-foreground/5 blur-sm" />
              <p className="text-xs text-muted-foreground mt-3">
                Sign in to view full details (team, funding, links)
              </p>
            </div>
          </div>
          <div className="px-6 py-4 border-t flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button asChild>
              <a
                href="/sign-in?auto=1&redirectTo=%2Fapp"
                className="inline-flex items-center gap-1">
                <Lock className="h-4 w-4" /> Sign in to view all
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
