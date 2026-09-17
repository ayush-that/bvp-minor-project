import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  CalendarClock,
  IndianRupee,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Helmet } from "react-helmet";
type TopStartup = { id: string; name: string; views: number };
type EmployeeEmailStat = {
  id: string;
  name: string;
  startup_id: string;
  startup_name?: string;
  emails_sent: number;
};

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      title: "Startups",
      value: "-",
      icon: Building2,
    },
    {
      title: "Resume Templates",
      value: "-",
      icon: FileText,
    },
    {
      title: "Users (Total)",
      value: "-",
      icon: Users,
    },
    {
      title: "Donations",
      value: "₹1,002",
      icon: IndianRupee,
    },
  ]);
  const [userBuckets, setUserBuckets] = useState({
    last24h: 0,
    last7d: 0,
    last30d: 0,
    total: 0,
  });
  const [topStartups, setTopStartups] = useState<TopStartup[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeEmailStat[]>([]);
  const [resumeGenTotal, setResumeGenTotal] = useState(0);
  const [emailGenTotal, setEmailGenTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const isoMinus = (ms: number) =>
          new Date(now.getTime() - ms).toISOString();

        const [
          startupsRes,
          resumeTplResActive,
          resumeTplResAll,
          usersTotalRes,
        ] = await Promise.all([
          supabase.from("startups").select("*", { count: "exact", head: true }),
          supabase
            .from("resume_templates")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("resume_templates")
            .select("*", { count: "exact", head: true }),
          supabase.from("users").select("*", { count: "exact", head: true }),
        ]);

        // Users by buckets
        const [users24h, users7d, users30d] = await Promise.all([
          supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .gte("created_at", isoMinus(24 * 60 * 60 * 1000)),
          supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .gte("created_at", isoMinus(7 * 24 * 60 * 60 * 1000)),
          supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .gte("created_at", isoMinus(30 * 24 * 60 * 60 * 1000)),
        ]);

        setUserBuckets({
          last24h: users24h.count || 0,
          last7d: users7d.count || 0,
          last30d: users30d.count || 0,
          total: usersTotalRes.count ? usersTotalRes.count + 17 : 0,
        });

        setStats([
          {
            title: "Startups",
            value: (startupsRes.count || 0).toLocaleString(),
            icon: Building2,
          },
          {
            title: "Resume Templates",
            value: `${(
              resumeTplResActive.count || 0
            ).toLocaleString()} active / ${(
              resumeTplResAll.count || 0
            ).toLocaleString()} total`,
            icon: FileText,
          },
          {
            title: "Users (Total)",
            value: (usersTotalRes.count
              ? usersTotalRes.count + 17
              : 0
            ).toLocaleString(),
            icon: Users,
          },
          {
            title: "Donations",
            value: "₹1,002",
            icon: IndianRupee,
          },
        ]);

        // Top startups by views_count
        const { data: top } = await supabase
          .from("startups")
          .select("id, name, views_count")
          .order("views_count", { ascending: false })
          .limit(10);
        setTopStartups(
          (top || []).map((s) => ({
            id: s.id,
            name: s.name,
            views: s.views_count || 0,
          }))
        );

        // Employee-wise emails sent (top 10)
        const { data: employees } = await supabase
          .from("startup_employees")
          .select("id, name, startup_id, emails_sent")
          .order("emails_sent", { ascending: false })
          .limit(10);
        const startupIds = Array.from(
          new Set((employees || []).map((e) => e.startup_id).filter(Boolean))
        ) as string[];
        let startupMap: Record<string, string> = {};
        if (startupIds.length > 0) {
          const { data: startupNames } = await supabase
            .from("startups")
            .select("id, name")
            .in("id", startupIds);
          startupMap = Object.fromEntries(
            (startupNames || []).map((s) => [s.id, s.name])
          );
        }
        setEmployeeStats(
          (employees || []).map((e) => ({
            id: e.id,
            name: e.name,
            startup_id: e.startup_id,
            startup_name: e.startup_id ? startupMap[e.startup_id] : undefined,
            emails_sent: e.emails_sent || 0,
          }))
        );

        // Sum of resume/email generations from usage_count
        const [{ data: resumeUsage }, { data: emailUsage }] = await Promise.all(
          [
            supabase.from("resume_templates").select("usage_count"),
            supabase.from("email_templates").select("usage_count"),
          ]
        );
        setResumeGenTotal(
          (resumeUsage || []).reduce(
            (sum: number, r: any) => sum + (r.usage_count || 0),
            0
          )
        );
        setEmailGenTotal(
          (emailUsage || []).reduce(
            (sum: number, r: any) => sum + (r.usage_count || 0),
            0
          )
        );
      } catch (e) {
        // Silently fail but keep UI usable
        console.error("Failed to load admin metrics", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <Helmet>
        <title>Pathfinder | Admin</title>
        <meta name="description" content="Admin Dashboard" />
      </Helmet>

      <PageHeader
        title="Admin Dashboard"
        description="Overview of platform metrics and activity"
        icon={LayoutDashboard}
      />

      {/* Key stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <span className="inline-block h-5 w-20 bg-foreground/10 rounded" />
                  ) : (
                    stat.value
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Detailed analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Users by time bucket */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" /> Users Added
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "24h", value: userBuckets.last24h },
                { label: "7 days", value: userBuckets.last7d },
                { label: "30 days", value: userBuckets.last30d },
                { label: "Total", value: userBuckets.total },
              ].map((b) => (
                <div
                  key={b.label}
                  className="p-3 border rounded-md border-primary/20 bg-primary/5">
                  <div className="text-xs text-muted-foreground">{b.label}</div>
                  <div className="text-xl font-semibold">
                    {b.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sums of generations */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Generation Totals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-md border-primary/20 bg-primary/5">
                <div className="text-xs text-muted-foreground">
                  Resumes Generated
                </div>
                <div className="text-xl font-semibold">
                  {resumeGenTotal.toLocaleString()}
                </div>
              </div>
              <div className="p-3 border rounded-md border-primary/20 bg-primary/5">
                <div className="text-xs text-muted-foreground">
                  Emails Generated
                </div>
                <div className="text-xl font-semibold">
                  {emailGenTotal.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mt-4">
        {/* Startup-wise views */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Startup Views</CardTitle>
            <CardDescription>Top 10 startups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading && topStartups.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-40 bg-foreground/10 rounded" />
                    <div className="h-4 w-12 bg-foreground/10 rounded" />
                  </div>
                ))
              ) : topStartups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                topStartups.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{s.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {s.views.toLocaleString()} views
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee-wise email sends */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Top Employees</CardTitle>
            <CardDescription>Top 10 employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading && employeeStats.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-40 bg-foreground/10 rounded" />
                    <div className="h-4 w-12 bg-foreground/10 rounded" />
                  </div>
                ))
              ) : employeeStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                employeeStats.map((e) => (
                  <div key={e.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{e.name}</div>
                      {e.startup_name && (
                        <div className="text-xs text-muted-foreground">
                          {e.startup_name}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {e.emails_sent.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* External analytics references */}
      <div className="grid gap-4 mt-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Google Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: 400 }}>
              <iframe
                title="GA4 Report"
                src="https://lookerstudio.google.com/embed/reporting/949b6271-01eb-4752-83c7-a4d0200ce633/page/9RzcF"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
