import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Sends GA4 page_view events on client-side route changes (SPA)
export default function GAListener() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gtag = (window as any)?.gtag as
        | ((
            command: string,
            action: string,
            params?: Record<string, unknown>
          ) => void)
        | undefined;
      if (typeof gtag === "function") {
        // Use event page_view so it respects the already-configured GA property from index.html
        gtag("event", "page_view", {
          page_path: path,
          page_title: document?.title || undefined,
        });
      }
    } catch {
      // no-op: analytics must never break navigation
    }
  }, [location.pathname, location.search]);

  return null;
}
