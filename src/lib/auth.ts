import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Authenticate an API request and return the user.
 * Returns an error response if unauthenticated.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      supabase,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, supabase, error: null };
}
