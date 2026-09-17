import { Link, Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { MOCK_USER } from "@/utils/mockUser";
import {
  LayoutDashboard,
  // Briefcase,
  Building2,
  Mail,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  // { name: "Internships", href: "/admin/internships", icon: Briefcase },
  { name: "Startups", href: "/admin/startups", icon: Building2 },
  { name: "Emails", href: "/admin/emails", icon: Mail },
];

export function AdminLayout() {
  // Using mock user for development
  const user = MOCK_USER;
  const logout = () => {
    console.log("Mock logout - no action taken");
  };
  
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        )}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">Admin</span>
            <span className="ml-2 text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {/* close btn for mobile */}
            <button
              className="md:hidden p-1 rounded-none hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-3 py-4 flex-1 flex flex-col h-[85%]">
          {/* user info */}
          <div className="mb-8 px-3">
            <div className="flex items-center space-x-3 ">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  className="h-10 w-10 rounded-full object-cover"
                  alt="User avatar"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-foreground/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-foreground">
                    {user?.name?.[0]?.toUpperCase() || "A"}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "Admin User"}</p>
                <p className="text-xs text-foreground/60 truncate">
                  {user?.email || "admin@pathfinder.app"}
                </p>
              </div>
            </div>
          </div>

          {/* nav */}
          <div className="flex-1 flex flex-col h-[85%] ">
            <nav className="space-y-1 flex-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
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
                    )}>
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* spacer to push sign out to bottom */}
            <div className="flex-1"></div>

            {/* footer actions at bottom */}
            <div className="pt-4 space-y-2">
              <Link
                to="/app"
                onClick={() => setSidebarOpen(false)}
                className="flex w-full items-center px-3 py-2 text-sm rounded-none text-primary hover:bg-foreground/10 transition-colors">
                <LayoutDashboard className="mr-3 h-4 w-4" />
                Go to app
              </Link>
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                }}
                className="flex w-full items-center px-3 py-2 text-sm rounded-none text-red-600 hover:bg-foreground/10 transition-colors">
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* mobile header */}
        <div className="h-16 border-b bg-background px-4 flex items-center justify-between md:hidden">
          <button
            className="p-2 rounded-md hover:bg-foreground/10"
            onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
            Admin
          </span>
          <Link
            to="/app"
            className="px-2.5 py-1.5 text-xs rounded-md bg-primary text-primary-foreground">
            App
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
