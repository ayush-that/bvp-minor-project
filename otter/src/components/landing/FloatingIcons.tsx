import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";

type LogoItem = { src: string };
const MAX_TILES = 6;

// Fixed positions (no randomization of placement). Exactly 6 spots.
const positions = [
  // Left edge (outside content)
  "-left-32 -top-16 -rotate-6",
  "-left-36 top-20 rotate-3",
  "-left-32 bottom-8 -rotate-3",
  // Right edge (outside content)
  "-right-32 -top-16 rotate-6",
  "-right-36 top-20 -rotate-3",
  "-right-32 bottom-8 rotate-3",
];

export function FloatingIcons() {
  // Use static logos from /public/landing
  const logos: LogoItem[] = [
    { src: "/landing/1.png" },
    { src: "/landing/2.png" },
    { src: "/landing/3.png" },
    { src: "/landing/4.png" },
    { src: "/landing/5.png" },
    { src: "/landing/6.png" },
  ];

  const arranged = useMemo(() => {
    if (logos.length === 0) return [] as Array<{ src: string; pos: string }>;
    // Randomize icons only, keep positions fixed and in order
    const shuffle = <T,>(arr: T[]) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const count = Math.min(MAX_TILES, logos.length, positions.length);
    const pos = positions.slice(0, count); // fixed places
    const chosen = shuffle(logos).slice(0, count); // random icons
    return chosen.map((l, i) => ({ src: l.src, pos: pos[i] }));
  }, [logos]);

  if (arranged.length === 0) return null;

  return (
    <>
      {arranged.map(({ src, pos }, index) => (
        <LogoTile key={index} src={src} pos={pos} />
      ))}
    </>
  );
}

function LogoTile({ src, pos }: { src: string; pos: string }) {
  const [failed, setFailed] = useState(false);
  const common = `hidden sm:block absolute ${pos} -z-10 pointer-events-none`;
  if (failed || !src) {
    return (
      <Building2
        className={`${common} w-16 h-16 text-foreground/30`}
        aria-hidden="true"
      />
    );
  }
  return (
    <img
      src={src}
      alt="startup logo"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${common} h-16 w-16 object-contain rounded-lg`}
    />
  );
}
