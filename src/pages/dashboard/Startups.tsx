import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Search,
  MapPin,
  Users,
  Bookmark,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase";
import { Startup } from "@/types";
import { Helmet } from "react-helmet";
import { useTheme } from "@/contexts/DarkMode";

export function Startups() {
  // persist filters using localstorage
  const [selectedSector, setSelectedSector] = useState(() => {
    return (
      sessionStorage.getItem("savedStartups_selectedSector") || "All Sectors"
    );
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem("savedStartups_searchQuery") || "";
  });
  const [sortBy, setSortBy] = useState(() => {
    return sessionStorage.getItem("savedStartups_sortBy") || "latest";
  });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [sectors, setSectors] = useState<string[]>(["All Sectors"]); // dyn sectors from db

  const [loading, setLoading] = useState(true);
  const BATCH_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const seedRef = useRef<number>(Math.floor(Math.random() * 1_000_000_000));
  const [relevanceIndex, setRelevanceIndex] = useState<Record<string, number>>(
    {}
  );
  const navigate = useNavigate();

  const theme = useTheme();

  // restore
  useEffect(() => {
    if (!loading) {
      const mainEl = document.querySelector("main");
      const savedScroll = sessionStorage.getItem("savedStartups_scrollY");

      if (mainEl && savedScroll) {
        requestAnimationFrame(() => {
          mainEl.scrollTo({
            top: parseInt(savedScroll),
            behavior: "smooth",
          });
        });
      }
    }
  }, [loading, startups.length]);

  // fetch all startups and unique sectors from db
  const fetchStartupsAndSectors = async () => {
    try {
      setLoading(true);

      // fetch all startups with employees and tags
      const { data: startupsData, error } = await supabase
        .from("startups")
        .select(
          `
            *,
            startup_employees (*),
            startup_tags (tag)
          `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Failed to fetch startups (RLS policy):", error);
        setStartups([]);
        setLoading(false);
        return;
      }

      // format data for ui
      const formattedStartups: Startup[] =
        startupsData?.map((startup: any) => {
          // If employees can't be fetched due to RLS, provide empty array
          // (employees are only shown in detail view, not list view)
          const employees = startup.startup_employees || [];
          
          return {
            ...startup,
            employees,
            tags: startup.startup_tags?.map((tag: any) => tag.tag) || [],
          };
        }) || [];

      setStartups(formattedStartups);

      // extract unique sectors from startups (case-insensitive)
      const uniqueSectors = Array.from(
        new Set(
          formattedStartups
            .map((startup) => startup.sector?.trim())
            .filter((sector) => sector) // filter out null/empty
            .map((sector) => sector!.toLowerCase()) // normalize to lowercase
        )
      )
        .map((sector) => {
          // find original case version from data
          const originalCase = formattedStartups.find(
            (startup) => startup.sector?.toLowerCase() === sector
          )?.sector;
          return originalCase || sector;
        })
        .sort();

      setSectors(
        [
          "All Sectors",
          uniqueSectors[uniqueSectors.length - 2],
          uniqueSectors[0],
          uniqueSectors[uniqueSectors.length - 1],
          uniqueSectors.slice(1, -3),
        ].flat()
      );
    } catch (error) {
      console.error("Error fetching startups and sectors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartupsAndSectors();
  }, []);

  // build a stable randomized order index for relevance sorting
  useEffect(() => {
    if (!startups.length) {
      setRelevanceIndex({});
      return;
    }
    // seeded shuffle of IDs
    const ids = startups.map((s) => s.id as unknown as string);
    let seed = seedRef.current;
    const rand = () => {
      // mulberry32
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const map: Record<string, number> = {};
    shuffled.forEach((id, index) => (map[id] = index));
    setRelevanceIndex(map);
  }, [startups]);

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showSortDropdown && !target.closest("[data-sort-dropdown]")) {
        setShowSortDropdown(false);
      }
    };

    if (showSortDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showSortDropdown]);

  // filter startups by sector and search (case-insensitive)
  const filteredStartups = startups
    .filter((startup: Startup) => {
      const matchesSector =
        selectedSector === "All Sectors" ||
        startup.sector?.toLowerCase() === selectedSector.toLowerCase();

      const matchesSearch =
        startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        startup.sector?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSector && matchesSearch;
    })
    .sort((a, b) => {
      // Always bubble trending startups to the top regardless of sort
      const aTrend = !!a.is_trending;
      const bTrend = !!b.is_trending;
      if (aTrend && !bTrend) return -1;
      if (!aTrend && bTrend) return 1;

      // Then apply the selected sort within each group
      switch (sortBy) {
        case "relevance": {
          const ai = relevanceIndex[(a.id as unknown as string) || "a"] ?? 0;
          const bi = relevanceIndex[(b.id as unknown as string) || "b"] ?? 0;
          return ai - bi;
        }
        case "latest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "a-z":
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        case "z-a":
          return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
        default:
          return 0;
      }
    });

  // slice for infinite scroll
  const visibleStartups = filteredStartups.slice(0, visibleCount);

  // reset visible count when filters/search/sort change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [selectedSector, searchQuery, sortBy]);

  // infinite scroll on main element
  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;

    const onScroll = () => {
      const el = mainEl as HTMLElement;
      const threshold = 400; // px from bottom
      if (
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold &&
        visibleCount < filteredStartups.length
      ) {
        setVisibleCount((c) =>
          Math.min(c + BATCH_SIZE, filteredStartups.length)
        );
      }
    };

    mainEl.addEventListener("scroll", onScroll, { passive: true } as any);
    return () => mainEl.removeEventListener("scroll", onScroll as any);
  }, [filteredStartups.length, visibleCount]);

  // calc startup count for any sector
  const getSectorCount = (sector: string) => {
    if (sector === "All Sectors") {
      return startups.length;
    }
    return startups.filter(
      (startup) => startup.sector?.toLowerCase() === sector.toLowerCase()
    ).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-background"></div>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>Pathfinder | Startups</title>
        <meta
          name="description"
          content="Explore a curated list of startups and discover exciting opportunities tailored to your career goals. Dive into detailed startup profiles and find your next big break."
        />
      </Helmet>

      <PageHeader
        title="Startups"
        description="Discover and explore startups and their opportunities"
        icon={Building2}
      />

      {/* search and filters - responsive layout */}
      <div className="space-y-4 mb-6">
        {/* search bar and sort - same row */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-400" />
            <Input
              placeholder="Search startups..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                sessionStorage.setItem(
                  "savedStartups_searchQuery",
                  e.target.value
                );
              }}
            />
          </div>

          {/* sort dropdown */}
          <div className="relative" data-sort-dropdown>
            <Button
              variant="outline"
              size="default"
              className="shadow-none min-w-[120px] justify-between"
              onClick={(e) => {
                e.stopPropagation();
                setShowSortDropdown(!showSortDropdown);
              }}>
              <span className="text-sm">
                {sortBy === "relevance" && "Relevance"}
                {sortBy === "latest" && "Latest"}
                {sortBy === "oldest" && "Oldest"}
                {sortBy === "a-z" && "A to Z"}
                {sortBy === "z-a" && "Z to A"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showSortDropdown && (
              <div className="absolute right-0 mt-1 w-[120px] bg-background border border-border rounded-md shadow-lg z-10">
                {[
                  { value: "relevance", label: "Relevance" },
                  { value: "latest", label: "Latest" },
                  { value: "oldest", label: "Oldest" },
                  { value: "a-z", label: "A to Z" },
                  { value: "z-a", label: "Z to A" },
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                      sortBy === option.value ? "bg-accent" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortBy(option.value);
                      sessionStorage.setItem(
                        "savedStartups_sortBy",
                        option.value
                      );
                      setShowSortDropdown(false);
                    }}>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* filters - scroll on mobile, wrap on tablet+ */}
        <div className="overflow-x-auto sm:overflow-x-visible pb-2">
          <div className="flex gap-2 min-w-max sm:min-w-0 flex-nowrap sm:flex-wrap">
            {sectors.map((sector) => (
              <Button
                key={sector}
                variant={selectedSector === sector ? "default" : "outline"}
                size="sm"
                className={`whitespace-nowrap shadow-none ${
                  selectedSector === sector
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                    : "hover:bg-primary/10 hover:text-primary hover:border-primary"
                }`}
                onClick={() => {
                  setSelectedSector(sector);
                  sessionStorage.setItem(
                    "savedStartups_selectedSector",
                    sector
                  );
                }}>
                {sector} ({getSectorCount(sector)})
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* startup grid - responsive cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStartups.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Bookmark className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">No startups found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || selectedSector !== "All Sectors"
                      ? "Try adjusting your search or filters"
                      : "No startups are currently available"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          visibleStartups.map((startup: Startup) => (
            <Card
              key={startup.id}
              className={`group transition-shadow cursor-pointer relative ${
                startup.is_trending
                  ? "border-primary/30 bg-gradient-to-br from-primary/20 to-foreground/10"
                  : ""
              }`}
              onClick={() => {
                const mainEl = document.querySelector("main");
                if (mainEl) {
                  sessionStorage.setItem(
                    "savedStartups_scrollY",
                    (mainEl as HTMLElement).scrollTop.toString()
                  );
                }
                navigate(`/app/startups/${startup.slug}`);
              }}>
              {startup.is_trending && (
                <div className="absolute top-4 right-4 z-10">
                  {/* <Badge variant="warning" className="text-[10px]">
                    Trending
                  </Badge> */}
                  <TrendingUp
                    className="h-4 w-4 fill-blue"
                    color={theme.theme == "dark" ? "yellow" : "blue"}
                  />
                </div>
              )}
              <div className="p-4">
                {/* header with logo, name, and bookmark */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 sm:h-8 sm:w-8 rounded-md bg-background flex items-center justify-center overflow-hidden flex-shrink-0 border">
                      <img
                        src={startup.logo_url || "https://placehold.co/400"}
                        alt={`${startup.name} logo`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://placehold.co/400";
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-sm font-semibold text-foreground truncate">
                        {startup.name}
                      </h3>
                      <p className="text-sm sm:text-xs text-foreground/60 line-clamp-2 mt-1">
                        {startup.description || "No description available"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* info lines - stacked on mobile, inline on larger screens */}
                <div className="space-y-3 sm:space-y-1 text-xs text-foreground/60 mb-4">
                  <div className="flex items-center gap-0 sm:flex-wrap">
                    <div className="flex items-center min-w-0">
                      <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {startup.location || "Not specified"}
                      </span>
                    </div>
                    <span className="sm:inline text-foreground/20 mx-1">•</span>
                    <div className="flex items-center min-w-0">
                      <Users className="mr-1 h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {startup.team_size || "Not specified"}
                      </span>
                    </div>
                    <span className="sm:inline text-foreground/20 mx-1.5">
                      •
                    </span>
                    <div className="flex items-center min-w-0">
                      <span className="truncate">
                        {startup.funding_amount
                          ? `${startup.funding_amount}`
                          : "Not disclosed"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* tags - wrap properly */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {startup.tags &&
                    startup.tags
                      .slice(0, 3)
                      .map((tag: string, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-[10px] bg-foreground/10 text-foreground/70">
                          {tag}
                        </Badge>
                      ))}
                  {startup.is_hiring && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-green-100 text-green-700">
                      Hiring
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      {/* loader for infinite scroll */}
      {visibleCount < filteredStartups.length && (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
