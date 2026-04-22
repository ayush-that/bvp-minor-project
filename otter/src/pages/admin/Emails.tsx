import { useEffect, useState } from "react";
import { Mail, Plus, Search } from "lucide-react";
import { PageHeader, PageHeaderAction } from "@/components/ui/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Template = {
  id: string;
  title: string;
  description: string | null;
  category: "internship" | "value-pitch" | "follow-up" | null;
  status: "active" | "draft" | "archived" | null;
  usage_count: number | null;
  success_rate: number | null;
  updated_at: string;
};

export function AdminEmails() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const load = async () => {
      // Hardcoded templates for admin view
      const HARDCODED_TEMPLATES: Template[] = [
        {
          id: "template-1",
          title: "Cold outreach to founders",
          description: "Direct and value-focused first message",
          category: "internship",
          status: "active",
          usage_count: parseInt(localStorage.getItem("template-usage-template-1") || "0"),
          success_rate: 0,
          updated_at: new Date().toISOString(),
        },
        {
          id: "template-2",
          title: "Follow-up after no response",
          description: "Gentle nudge with added value",
          category: "follow-up",
          status: "active",
          usage_count: parseInt(localStorage.getItem("template-usage-template-2") || "0"),
          success_rate: 0,
          updated_at: new Date().toISOString(),
        },
        {
          id: "template-3",
          title: "Internship inquiry",
          description: "Professional internship application",
          category: "internship",
          status: "active",
          usage_count: parseInt(localStorage.getItem("template-usage-template-3") || "0"),
          success_rate: 0,
          updated_at: new Date().toISOString(),
        },
        {
          id: "template-4",
          title: "Value-first approach",
          description: "Lead with what you can offer",
          category: "value-pitch",
          status: "active",
          usage_count: parseInt(localStorage.getItem("template-usage-template-4") || "0"),
          success_rate: 0,
          updated_at: new Date().toISOString(),
        },
        {
          id: "template-5",
          title: "Networking follow-up",
          description: "After meeting at event or referral",
          category: "follow-up",
          status: "active",
          usage_count: parseInt(localStorage.getItem("template-usage-template-5") || "0"),
          success_rate: 0,
          updated_at: new Date().toISOString(),
        },
        {
          id: "template-6",
          title: "Final follow-up",
          description: "Last attempt to get a response",
          category: "follow-up",
          status: "active",
          usage_count: parseInt(localStorage.getItem("template-usage-template-6") || "0"),
          success_rate: 0,
          updated_at: new Date().toISOString(),
        },
      ];

      try {
        setLoading(true);
        // Skip database, use hardcoded templates
        setTemplates(HARDCODED_TEMPLATES);
      } catch (e) {
        setTemplates(HARDCODED_TEMPLATES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Manage Emails"
        description="Manage email templates"
        icon={Mail}>
        <PageHeaderAction icon={Plus}>Add Template</PageHeaderAction>
      </PageHeader>

      {/* search - mobile responsive */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates or contacts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* email templates */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Email Templates</h2>
        <div className="space-y-4">
          {loading && templates.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-5 w-40 bg-foreground/10 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-3/4 bg-foreground/10 rounded mb-2" />
                  <div className="h-4 w-2/3 bg-foreground/10 rounded" />
                </CardContent>
              </Card>
            ))
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No templates found</p>
          ) : (
            templates
              .filter((t) =>
                [t.title, t.description, t.category, t.status]
                  .map((x) => (x ? String(x).toLowerCase() : ""))
                  .some((s) => s.includes(searchQuery.toLowerCase()))
              )
              .map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate">
                          {template.title}
                        </CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                      {template.status && (
                        <Badge
                          className="w-fit"
                          variant={
                            template.status === "active"
                              ? "success"
                              : "secondary"
                          }>
                          {template.status.charAt(0).toUpperCase() +
                            template.status.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium">Usage Count</p>
                        <p className="text-sm text-muted-foreground">
                          {(template.usage_count ?? 0).toLocaleString()} times
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Success Rate</p>
                        <p className="text-sm text-muted-foreground">
                          {template.success_rate != null
                            ? `${template.success_rate}%`
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(template.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
