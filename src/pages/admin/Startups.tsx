import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Globe,
  TrendingUp,
  MapPin,
  Users,
  DollarSign,
} from "lucide-react";
import { ChevronDown } from "lucide-react";
import { PageHeader, PageHeaderAction } from "@/components/ui/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StartupFormModal } from "@/components/admin/StartupFormModal";
import { supabase } from "@/utils/supabase";
import { Startup } from "@/types";

export function AdminStartups() {
  const [searchQuery, setSearchQuery] = useState("");
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStartup, setEditingStartup] = useState<Startup | undefined>();
  const [employeeSort, setEmployeeSort] = useState<"asc" | "desc" | "none">(
    "none"
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // fetch startups from db
  const fetchStartups = async () => {
    try {
      setLoading(true);

      // fetch startups with employees and tags
      const { data: startupsData, error: startupsError } = await supabase
        .from("startups")
        .select(
          `
          *,
          startup_employees (*),
          startup_tags (tag)
        `
        )
        .order("created_at", { ascending: false });

      if (startupsError) throw startupsError;

      // format data for ui
      const formattedStartups: Startup[] =
        startupsData?.map((startup) => ({
          ...startup,
          employees: startup.startup_employees || [],
          tags: startup.startup_tags?.map((tag: any) => tag.tag) || [],
        })) || [];

      setStartups(formattedStartups);
    } catch (error) {
      console.error("Error fetching startups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, []);

  // close filter dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (showFilterDropdown && !target.closest("[data-admin-filter]")) {
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) {
      document.addEventListener("click", onDocClick);
      return () => document.removeEventListener("click", onDocClick);
    }
  }, [showFilterDropdown]);

  // filter startups by search query
  const filteredStartups = startups.filter(
    (startup) =>
      startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.sector?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleStartups = useMemo(() => {
    const arr = [...filteredStartups];
    if (employeeSort === "asc") {
      arr.sort(
        (a, b) => (a.employees?.length || 0) - (b.employees?.length || 0)
      );
    } else if (employeeSort === "desc") {
      arr.sort(
        (a, b) => (b.employees?.length || 0) - (a.employees?.length || 0)
      );
    }
    return arr;
  }, [filteredStartups, employeeSort]);

  const handleAddStartup = () => {
    setEditingStartup(undefined);
    setModalOpen(true);
  };

  const handleEditStartup = (startup: Startup) => {
    setEditingStartup(startup);
    setModalOpen(true);
  };

  const handleDeleteStartup = async (startupId: string) => {
    try {
      const { error } = await supabase
        .from("startups")
        .delete()
        .eq("id", startupId);

      if (error) throw error;

      // refresh data
      await fetchStartups();
    } catch (error) {
      console.error("Error deleting startup:", error);
    }
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingStartup(undefined);
    fetchStartups();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Manage Startups"
        description="Add and manage startup listings"
        icon={Building2}>
        <PageHeaderAction icon={Plus} onClick={handleAddStartup}>
          Add Startup
        </PageHeaderAction>
      </PageHeader>

      {/* search and filters - mobile responsive */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search startups..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Filter dropdown button (same style as normal button) */}
        <div className="relative sm:w-auto w-full" data-admin-filter>
          <Button
            variant="outline"
            className="w-full sm:w-auto justify-between sm:justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setShowFilterDropdown(!showFilterDropdown);
            }}>
            <span className="text-sm">
              {employeeSort === "none" && "Default"}
              {employeeSort === "asc" && "Low to High"}
              {employeeSort === "desc" && "High to Low"}
            </span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-[220px] bg-background border border-border rounded-md shadow-md z-10">
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground/80">
                Employees
              </div>
              <div className="py-1">
                {[
                  { key: "none", label: "Default" },
                  { key: "asc", label: "Low to High" },
                  { key: "desc", label: "High to Low" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${
                      employeeSort === (opt.key as any) ? "bg-accent" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEmployeeSort(opt.key as any);
                      setShowFilterDropdown(false);
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* startup listings */}
      <div className="space-y-4">
        {visibleStartups.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Building2 className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No startups found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Get started by adding your first startup"}
                </p>
              </div>
              {!searchQuery && (
                <Button
                  onClick={handleAddStartup}
                  className="text-black border border-gray-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Startup
                </Button>
              )}
            </div>
          </Card>
        ) : (
          visibleStartups.map((startup) => (
            <Card key={startup.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex items-start space-x-4 min-w-0 flex-1">
                    {/* logo */}
                    <div className="flex-shrink-0">
                      <img
                        src={startup.logo_url || "https://placehold.co/400"}
                        alt={`${startup.name} logo`}
                        className="h-12 w-12 rounded-none object-cover border"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/400";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="truncate">{startup.name}</span>
                        {startup.is_hiring && (
                          <Badge variant="success" className="text-xs w-fit">
                            Hiring
                          </Badge>
                        )}

                        {startup.is_trending && (
                          <Badge variant="warning" className="w-fit">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            Trending
                          </Badge>
                        )}

                        <Badge
                          className="w-fit"
                          variant={
                            startup.status === "verified"
                              ? "success"
                              : startup.status === "pending"
                              ? "warning"
                              : "danger"
                          }>
                          {startup.status.charAt(0).toUpperCase() +
                            startup.status.slice(1)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {startup.description || "No description available"}
                      </CardDescription>

                      {/* tags */}
                      {startup.tags && startup.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {startup.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {startup.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{startup.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* main info grid - responsive */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm font-medium flex items-center">
                      <Building2 className="h-3 w-3 mr-1" />
                      Sector
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {startup.sector || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      Location
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {startup.location || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      Team Size
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {startup.team_size || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Funding
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {startup.funding_round && startup.funding_amount
                        ? `${startup.funding_round} • ${startup.funding_amount}`
                        : startup.funding_round ||
                          startup.funding_amount ||
                          "Not disclosed"}
                    </p>
                  </div>
                </div>

                {/* stats grid - responsive */}
                <div className="mt-4 grid gap-4 grid-cols-3">
                  <div>
                    <p className="text-sm font-medium">Views</p>
                    <p className="text-sm text-muted-foreground">
                      {startup.views_count.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Saves</p>
                    <p className="text-sm text-muted-foreground">
                      {startup.saves_count.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Employees</p>
                    <p className="text-sm text-muted-foreground">
                      {startup.employees?.length || 0} contacts
                    </p>
                  </div>
                </div>

                {/* website link */}
                {startup.website && (
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Globe className="mr-2 h-4 w-4 flex-shrink-0" />
                      <a
                        href={startup.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground truncate">
                        {startup.website}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteStartup(startup.id)}
                  className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={() => handleEditStartup(startup)}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* startup form modal */}
      <StartupFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        startup={editingStartup}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
