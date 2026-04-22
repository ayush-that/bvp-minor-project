# Pathfinder

AI-powered intern discovery and outreach. Browse verified startups, save internships, and send personalized emails—built with a consistent design system and Supabase

## Highlights

- Consistent UI system: Tailwind + shadcn primitives with design tokens
- Public landing with live user count and startup logos
- App shell at /app (also aliased as /dashboard)
- Auth with Supabase (Google OAuth) and Admin guard
- Feature-gated pages show a friendly Coming Soon state

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + tailwindcss-animate + class-variance-authority
- shadcn-like UI primitives (button, input, card, etc.)
- Supabase JS v2 for auth and data
- React Router v6

## Environment

Create a .env file (or Vercel env vars) with:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## Scripts

- npm run dev – start dev server
- npm run build – typecheck and build
- npm run preview – preview production build
- npm run lint – run ESLint

## App Structure

```
src/
  components/
    layout/           # Navbar, Dashboard/Admin layouts
    landing/          # Hero and decorative UI
    ui/               # Button, Card, Input, ComingSoon, etc.
  contexts/           # Auth context, Theme
  pages/
    Landing.tsx       # Public landing
    app/              # User app routes (protected)
    dashboard/        # Route pages used within app shell
    admin/            # Admin routes (protected)
  utils/
    supabase.ts       # Supabase client
```

## Routing

- / – Landing page (no auto-redirect)
- /sign-in, /sign-up – Auth screens
- /team, /donate, /how-to-use – Public informational pages
- /app/\* – Protected app shell
- /dashboard/_ – Alias to /app/_
- /admin/\* – Admin-only

Unfinished pages (Bookmarks, Email Templates, Saved Internships) display a Coming Soon placeholder.

## Design Tokens

- Primary color: CSS var --primary set to brand blue (#1B9BFA)
- Radius: --radius = 0.25rem (rounded-md)
- Avoid hard-coded colors; use tokenized classes (text-primary, bg-foreground/10, etc.)

## Development Notes

- Do not modify Supabase auth/session behavior
- Public images live in /public; most vector/brand logos in src/assets
- Keep consistent spacing, rounded-md, and hover/focus states across UI

## Deployment

- Vercel recommended. Include VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars.

## License

MIT
