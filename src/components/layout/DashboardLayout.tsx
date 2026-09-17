import { Link, Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { MOCK_USER } from "@/utils/mockUser";
import {
  Building2,
  Mail,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle,
  Camera,
  Compass,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { NotesTab } from "../notes/NotesTab";

import { ScrollToTopButton } from "../ScrollToTopFAB";

// user avatar comp w/ fallback to initials for dashboard
function DashboardUserAvatar({
  user,
  size = "h-9 w-9",
}: {
  user: any;
  size?: string;
}) {
  const [imageError, setImageError] = useState(false);

  // fallback to initials if no avatar or img fails to load
  if (!user?.avatar_url || imageError) {
    return (
      <div
        className={`${size} rounded-full bg-primary/10 flex items-center justify-center`}
      >
        <span className="text-sm font-medium text-primary">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={user.avatar_url}
      alt={`${user.name || "User"} avatar`}
      className={`${size} rounded-full object-cover border border-foreground/50`}
      onError={() => setImageError(true)}
    />
  );
}

const navigation = [
  { name: "AI Job Matcher", href: "/app/pathfinder", icon: Compass },
  { name: "Startups", href: "/app/startups", icon: Building2 },
  { name: "Email Templates", href: "/app/emails", icon: Mail },
  { name: "Profile", href: "/app/settings", icon: Settings },
  { name: "Resume Builder", href: "/app/resumes", icon: FileText },
  { name: "ATS Score Check", href: "/app/ats", icon: CheckCircle },
  { name: "Professional Headshot", href: "/app/headshot", icon: Camera },
];

export function DashboardLayout() {
  const user = MOCK_USER;
  const logout = () => {
    console.log("Mock logout - no action taken");
  };

  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // close the user menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [userMenuOpen]);

  // Authentication removed - confetti effect disabled

  return (
    <div className="flex h-screen bg-background">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-300 ease-in-out md:relative md:translate-x-0 pl-[1%]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/app" className="flex items-center">
            <span className="text-xl font-bold text-primary">Dashboard</span>
          </Link>
          {/* close btn for mobile */}
          <button
            className="sm:hidden p-1 rounded-none hover:bg-foreground/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" color="red" />
          </button>
        </div>

        <div className="flex-1 flex flex-col h-[85%]">
          {/* nav */}
          <nav className="px-3 space-y-1 py-4">
            {navigation.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href === "/app/startups" && location.pathname === "/app");
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)} // close mobile menu on nav
                  className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                    isActive
                      ? "text-primary bg-foreground/5"
                      : "text-foreground/70 hover:bg-foreground/10"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* spacer to push user controls to bottom */}
          <div className="flex-1"></div>
          {/* user + theme controls at bottom */}
          <div className="px-3 pr-4 pt-4 border-t border-foreground/10">
            <div className="flex items-center justify-between px-2">
              <div ref={userMenuRef} className="relative group min-w-0">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 min-w-0 hover:opacity-90"
                >
                  <DashboardUserAvatar user={user} size="h-8 w-8" />
                  <p className="text-sm font-medium truncate">
                    {user?.name || "User"}
                  </p>
                </button>
                {/* dropdown opens on hover (desktop) or toggle (touch/click) */}
                <div
                  className={`absolute bottom-4 left-0 mb-2 z-50 min-w-[160px] rounded-md border border-foreground/10 bg-background p-1 ${
                    userMenuOpen ? "block" : "hidden"
                  } group-hover:block`}
                  role="menu"
                  aria-label="User menu"
                >
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-foreground/10 text-red-600"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSidebarOpen(false);
                      logout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* top navbar */}
        <div className="h-16 border-b bg-background px-4 flex items-center justify-between">
          {/* hamburger menu for mobile */}
          <button
            className="md:hidden p-2 rounded-none hover:bg-foreground-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <ScrollToTopButton />

      {/* notes tab - only show when authenticated */}
      <NotesTab />
    </div>
  );
}
