import { Hero } from "@/components/landing/Hero";
import { useEffect } from "react";
import { Helmet } from "react-helmet";

export function Landing() {
  // Authentication removed
  useEffect(() => {
    // Hide scrollbar on the whole page while on Landing
    const html = document.documentElement;
    const prev = html.className;
    html.classList.add("landing-hidden-scroll");
    return () => {
      html.className = prev;
    };
  }, []);

  return (
    <div className="w-full min-h-screen overflow-x-hidden overflow-y-auto bg-background bg-dots">
      <Helmet>
        <title>Pathfinder</title>
        <meta
          name="description"
          content="Welcome to Pathfinder, your ultimate platform for discovering startups and advancing your career. Explore opportunities and grow with us."
        />
        <link rel="canonical" href={`${window.location.origin}/`} />
        <meta property="og:title" content="Pathfinder" />
        <meta
          property="og:description"
          content="Discover startups, send emails, and land internships with AI-powered tools."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/`} />
        <meta
          property="og:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pathfinder" />
        <meta
          name="twitter:description"
          content="Discover startups, send emails, and land internships with AI-powered tools."
        />
        <meta
          name="twitter:image"
          content={`${window.location.origin}/ottericon.png`}
        />
      </Helmet>

      <main>
        <Hero />
      </main>
    </div>
  );
}
