import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();

  // hide on startup detail pages
  const isStartupDetailPage = location.pathname.match(/^\/app\/startups\/[^\/]+$/);

  useEffect(() => {
    scrollContainerRef.current = document.querySelector("main");

    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      if (scrollContainerRef.current.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    const el = scrollContainerRef.current;
    el?.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, []);
  
  if (isStartupDetailPage) {
    return null;
  }

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-16 right-2 sm:right-4 z-50 p-2 rounded-full shadow-lg transition-all",
        "text-[#1B9BFA] bg-background border border-border rounded-full p-1.5 shadow-lg hover:shadow-xl transition-shadow",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-label="Scroll to top">
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
