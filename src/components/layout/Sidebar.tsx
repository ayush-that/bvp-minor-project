import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, FileCode, Settings, Mail } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Resumes", href: "/app/resumes", icon: FileText },
  { name: "Templates", href: "/app/templates", icon: FileCode },
  { name: "Newsletter", href: "/app/newsletter", icon: Mail },
  { name: "Settings", href: "/app/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center px-4 border-b">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold">Pathfinder</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                "group flex items-center rounded-none px-3 py-2 text-sm font-medium"
              )}>
              <item.icon
                className={cn(
                  isActive
                    ? "text-accent-foreground"
                    : "text-muted-foreground group-hover:text-accent-foreground",
                  "mr-3 h-5 w-5 flex-shrink-0"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
