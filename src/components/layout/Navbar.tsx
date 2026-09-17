import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import ThemeToggle from "../ThemeToggle";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Menu, X } from "lucide-react";

const navigation = [
  { name: "AI Matcher", href: "/app/pathfinder" },
  { name: "Startups", href: "/startups" },
  { name: "Emails", href: "/emails" },
  { name: "Resumes", href: "/resumes" },
  { name: "ATS", href: "/ats" },
];

export function Navbar() {
  // Authentication removed
  const [userCount, setUserCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // fetch live user count via RPC (works without auth through RLS-safe function)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_user_count");
        if (mounted) setUserCount(error ? 0 : Number(data ?? 0));
      } catch (e) {
        if (mounted) setUserCount(0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/70 border-b border-foreground/10">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link to="/" className="mr-6 flex items-center space-x-2 ml-3">
          <span className="text-2xl font-bold text-primary">App</span>
        </Link>

        <div className="hidden md:flex space-x-1 flex-1 justify-center">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="px-3 py-2 text-sm rounded-md text-foreground/80 hover:bg-foreground/10 transition-colors hover:underline decoration-primary/60 underline-offset-4"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center space-x-4 ml-auto">
          <span className="text-xs text-muted-foreground">
            {`Join ${userCount.toLocaleString()}+ users`}
          </span>
          <ThemeToggle />
          <Link to="/app">
            <Button className="relative group overflow-hidden bg-gradient-to-r from-primary to-primary/70 hover:opacity-90 transition-all duration-300 rounded-md">
              <div className="absolute inset-0 w-full h-full bg-background/30 group-hover:scale-150 transition-transform duration-500 rounded-md blur-xl"></div>
              <span className="relative z-10 text-primary-foreground">
                Get Started
              </span>
            </Button>
          </Link>
        </div>

        <div className="md:hidden ml-auto flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-foreground/80 hover:bg-foreground/10"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-lg">
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base rounded-md text-foreground/80 hover:bg-foreground/10 transition-colors"
              >
                {item.name}
              </Link>
            ))}

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {`Join ${userCount.toLocaleString()}+ users`}
                </span>
                <ThemeToggle />
              </div>
              <Link
                to="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="block"
              >
                <Button className="w-full bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
