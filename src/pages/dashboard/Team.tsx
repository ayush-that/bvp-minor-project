import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { PageHeader } from "@/components/ui/page-header";
import { User } from "lucide-react";

const teamMembers = [
  {
    name: "Satvik Sakena",
    role: "designer",
    image: "/satvik.png",
    bio: "Designs clean, intuitive interfaces that users love.",
    link: "https://www.linkedin.com/in/satvik-saksena/",
  },
  {
    name: "Pustak Pathak",
    role: "dev",
    image: "/pustak.png",
    bio: "1337",
    link: "https://pstk.fun",
  },
  {
    name: "Aahan Agarwal",
    role: "random 1st year",
    image: "/aahan.png",
    bio: "Full-stack developer passionate about building meaningful tech.",
    link: "https://instagram.com/aahan__agarwal",
  },
];

export default function Team() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Pathfinder | Team</title>
        <meta
          name="description"
          content="Meet the talented team behind Pathfinder. Learn about our designers, developers, and visionaries who bring this platform to life."
        />
        <link rel="canonical" href={`${window.location.origin}/team`} />
        <meta property="og:title" content="Pathfinder | Team" />
        <meta
          property="og:description"
          content="Meet the talented team behind Pathfinder."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/team`} />
        <meta
          property="og:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pathfinder | Team" />
        <meta
          name="twitter:description"
          content="Meet the talented team behind Pathfinder."
        />
        <meta
          name="twitter:image"
          content={`${window.location.origin}/ottericon.png`}
        />
      </Helmet>

      <PageHeader
        icon={User}
        title="Team"
        description="Meet the brains behind Pathfinder"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <Card
            key={member.name}
            className="text-center p-4 cursor-pointer group transition-all rounded-none border border-foreground/10 hover:shadow-lg"
            onClick={() => window.open(member.link, "_blank")}>
            <img
              src={member.image}
              alt={member.name}
              className="w-20 h-20 rounded-full mx-auto mb-1 object-cover border"
              loading="lazy"
            />
            <CardContent>
              <h2 className="text-sm font-semibold">{member.name}</h2>
              <p className="text-xs text-primary">{member.role}</p>
              <p className="text-xs mt-1 text-foreground/60">{member.bio}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <h2 className="text-base font-semibold mb-2">Want to work with us?</h2>
        <p className="text-muted-foreground mb-4 text-xs">
          We're always looking for passionate people to join Pathfinder.
        </p>
        <Button asChild variant="ghost" className="text-primary text-sm">
          <a href="mailto:hello@usepathfinder.app">
            email us at hello@usepathfinder.app
          </a>
        </Button>
      </div>
    </div>
  );
}
