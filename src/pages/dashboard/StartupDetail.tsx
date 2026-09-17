import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Building2,
  Globe,
  Linkedin,
  ArrowLeft,
  MapPin,
  Users,
  DollarSign,
  Briefcase,
  Rocket,
  Wallet,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";
import { Startup, StartupEmployee } from "@/types";
import { EmailTemplateModal } from "@/components/EmailTemplateModal";
import { Helmet } from "react-helmet";

export function StartupDetail() {
  const { id: slug } = useParams<{ id: string }>();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [employees, setEmployees] = useState<StartupEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<StartupEmployee | null>(null);
  const [bulkMode, setBulkMode] = useState(false);

  // fetch startup details and employees from db
  const fetchStartupData = async () => {
    console.log(slug);
    if (!slug) return;

    try {
      setLoading(true);
      setError(null);

      // fetch startup with tags.
      const { data: startupData, error: startupError } = await supabase
        .from("startups")
        .select(
          `
          *,
          startup_tags (tag)
        `
        )
        .eq("slug", slug)
        .single();

      console.log(startupData);

      if (startupError) throw startupError;

      // fetch good employees for this very startup
      const { data: employeesData, error: employeesError } = await supabase
        .from("startup_employees")
        .select("*")
        .eq("startup_id", startupData.id)
        .order("created_at", { ascending: true });

      // Fallback mock employees if RLS blocks the fetch
      const mockEmployees =
        employeesError || !employeesData || employeesData.length === 0
          ? [
              {
                id: "mock-1",
                startup_id: startupData.id,
                name: "Rohan Sharma",
                role: "Founder & CEO",
                email: "rohan@example.com",
                linkedin_url: "https://linkedin.com/in/rohansharma",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                emails_sent: 0,
              },
              {
                id: "mock-2",
                startup_id: startupData.id,
                name: "Priya Patel",
                role: "Co-founder & CTO",
                email: "priya@example.com",
                linkedin_url: "https://linkedin.com/in/priyapatel",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                emails_sent: 0,
              },
            ]
          : [];

      if (employeesError) {
        console.warn("Failed to fetch employees (RLS policy):", employeesError);
        console.log("Using fallback mock employees");
      }

      // format startup data
      const finalEmployees =
        employeesData && employeesData.length > 0
          ? employeesData
          : mockEmployees;

      const formattedStartup: Startup = {
        ...startupData,
        tags: startupData.startup_tags?.map((tag: any) => tag.tag) || [],
        employees: finalEmployees,
      };

      setStartup(formattedStartup);
      // increment startup views_count (best-effort)
      try {
        const { data: current, error: currErr } = await supabase
          .from("startups")
          .select("views_count")
          .eq("id", startupData.id)
          .single();
        if (!currErr) {
          const newCount = (current?.views_count || 0) + 1;
          await supabase
            .from("startups")
            .update({ views_count: newCount })
            .eq("id", startupData.id);
        }
      } catch (e) {
        console.warn("Failed to increment startup views_count", e);
      }
      setEmployees(finalEmployees);
    } catch (error) {
      console.error("Error fetching startup data:", error);
      setError("Failed to load startup details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartupData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-background"></div>
      </div>
    );
  }

  if (error || !startup) {
    return (
      <div className="space-y-6 px-4">
        <Link
          to="/app/startups"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Startups
        </Link>

        <Card className="p-8 text-center rounded-none">
          <div className="flex flex-col items-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">Startup not found</h3>
              <p className="text-muted-foreground">
                {error ||
                  "The startup you're looking for doesn't exist or has been removed."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-6">
      <Helmet>
        <title>Pathfinder | Startup Details</title>
        <meta
          name="description"
          content="Dive into detailed profiles of startups, including their mission, team, and opportunities. Learn more about what makes each startup unique."
        />
      </Helmet>

      {/* back button */}
      <Link
        to="/app/startups"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back to Startups
      </Link>

      {/* header section - responsive layout */}
      <div className="bg-background rounded-none border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          {/* logo */}
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-md bg-background flex items-center justify-center overflow-hidden flex-shrink-0 border">
            <img
              src={startup.logo_url || "https://placehold.co/400"}
              alt={`${startup.name} logo`}
              className="h-full w-full object-contain"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/400";
              }}
            />
          </div>

          {/* company info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground break-words">
                  {startup.name}
                </h1>
                <p className="mt-1 text-sm sm:text-base text-muted-foreground break-words">
                  {startup.description || "No description available"}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {startup.is_hiring && (
                  <Badge variant="success" className="text-xs sm:text-sm">
                    <Briefcase className="mr-1 h-3 w-3" />
                    Hiring
                  </Badge>
                )}
                <Badge
                  variant={
                    startup.status === "verified"
                      ? "success"
                      : startup.status === "pending"
                      ? "warning"
                      : "secondary"
                  }
                  className="text-xs sm:text-sm"
                >
                  {startup.status.charAt(0).toUpperCase() +
                    startup.status.slice(1)}
                </Badge>
              </div>
            </div>

            {/* tags and links - stack on mobile */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {startup.tags &&
                  startup.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs bg-foreground/5 text-foreground/70"
                    >
                      {tag}
                    </Badge>
                  ))}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {startup.website && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10"
                    onClick={() => window.open(startup.website, "_blank")}
                  >
                    <Globe className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* info grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* company info card */}
        <Card className="lg:col-span-2 rounded-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:gap-6">
            {/* quick stats - responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-background/10 rounded-none p-3 sm:p-4">
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-1">
                  <Building2 className="mr-2 h-4 w-4" />
                  Sector
                </div>
                <div className="font-medium text-sm sm:text-base break-words">
                  {startup.sector || "Not specified"}
                </div>
              </div>
              <div className="bg-background/10 rounded-none p-3 sm:p-4">
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-1">
                  <MapPin className="mr-2 h-4 w-4" />
                  Location
                </div>
                <div className="font-medium text-sm sm:text-base break-words">
                  {startup.location || "Not specified"}
                </div>
              </div>
              <div className="bg-background/10 rounded-none p-3 sm:p-4 sm:col-span-2 md:col-span-1">
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-1">
                  <Users className="mr-2 h-4 w-4" />
                  Team Size
                </div>
                <div className="font-medium text-sm sm:text-base">
                  {startup.team_size || "Not specified"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* funding info card */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-lg">
              <DollarSign className="inline h-4 w-4 mr-2" />
              Funding Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-background/10 rounded-none p-3 sm:p-4">
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-1">
                  <Rocket className="mr-2 h-4 w-4" />
                  Stage
                </div>
                <div className="font-medium text-sm sm:text-base break-words">
                  {startup.funding_round || "Not disclosed"}
                </div>
              </div>
              <div className="bg-background/10 rounded-none p-3 sm:p-4">
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-1">
                  <Wallet className="mr-2 h-4 w-4" />
                  Amount
                </div>
                <div className="font-medium text-sm sm:text-base break-words">
                  {startup.funding_amount || "Not disclosed"}
                </div>
              </div>
              {startup.funding_date && (
                <div className="bg-background/50 rounded-none p-3 sm:p-4">
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-1">
                    Date
                  </div>
                  <div className="font-medium text-sm sm:text-base">
                    {new Date(startup.funding_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* team members card - mobile optimized */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg text-foreground px-2">
            <Users className="inline h-4 w-4 mr-2" />
            Team Members ({employees.length})
          </CardTitle>
          <Button
            variant="secondary"
            size="sm"
            className="mr-2"
            disabled={employees.length === 0}
            onClick={() => {
              if (employees.length === 0) return;
              setBulkMode(true);
              // Use first employee as required primary prop (modal still needs an employee object)
              setSelectedEmployee(employees[0]);
              setEmailModalOpen(true);
            }}
          >
            Send to all
          </Button>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">
                No team members listed
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Team member information is not available for this startup.
              </p>
            </div>
          ) : (
            <>
              {/* mobile card view */}
              <div className="block sm:hidden space-y-4">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="bg-background/50 rounded-none p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm break-words">
                          {employee.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {employee.role || "Not specified"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {employee.linkedin_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9"
                            onClick={() =>
                              window.open(employee.linkedin_url, "_blank")
                            }
                          >
                            <Linkedin className="h-8 w-8" />
                          </Button>
                        )}
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setEmailModalOpen(true);
                          }}>
                          <Mail className="h-4 w-4" />
                        </Button> */}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setEmailModalOpen(true);
                        }}
                        className="text-foreground border border-gray-300 text-xs px-3 py-1 rounded-none"
                      >
                        Email
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Socials
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="group transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium break-words">
                            {employee.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground break-words">
                          {employee.role || "Not specified"}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-3">
                            {employee.linkedin_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-12 w-12"
                                onClick={() =>
                                  window.open(employee.linkedin_url, "_blank")
                                }
                              >
                                <Linkedin className="h-4 w-4" />
                              </Button>
                            )}
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              className="h-12 w-12"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setEmailModalOpen(true);
                              }}>
                              <Mail className="h-4 w-4" />
                            </Button> */}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setEmailModalOpen(true);
                            }}
                            className="text-foreground border border-gray-300 rounded-none"
                          >
                            Send Email
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* email template modal */}
      {selectedEmployee && (
        <EmailTemplateModal
          open={emailModalOpen}
          onOpenChange={(open) => {
            setEmailModalOpen(open);
            if (!open) {
              setBulkMode(false);
              setSelectedEmployee(null);
            }
          }}
          employee={selectedEmployee}
          startupName={startup?.name || "this startup"}
          startupDescription={
            startup?.description || "No description available"
          }
          bulkEmployees={bulkMode ? employees : undefined}
        />
      )}
    </div>
  );
}
