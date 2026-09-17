import { createClient } from "@supabase/supabase-js";

// Minimal handler without @vercel/node types to avoid extra deps
export default async function handler(req: any, res: any) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey =
    process.env.VITE_SUPABASE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If not configured, return a safe fallback so the UI still renders
  if (!supabaseUrl || !serviceRoleKey) {
    res.status(200).json({ count: 0 });
    return;
  }

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { count, error } = await admin
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      res.status(200).json({ count: 0 });
      return;
    }

    res.status(200).json({ count: count ?? 0 });
  } catch (e) {
    res.status(200).json({ count: 0 });
  }
}
