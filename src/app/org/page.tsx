import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { User, Organization } from "@/lib/types";
import { getOrgDomain, getOrgDisplayName } from "@/lib/org-utils";
import { OrgDashboardClient } from "@/components/org/org-dashboard-client";

export const metadata: Metadata = {
  title: "Organization Dashboard — Veltri",
  description: "Manage your organization's discount for members on Veltri.",
};

export default async function OrgPage() {
  const supabase = await createClient();

  // Must be authenticated
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login?next=/org");

  // Must have an org email
  const orgDomain = getOrgDomain(authUser.email ?? "");
  if (!orgDomain) redirect("/profile");

  // Get current user profile
  const { data: profileData } = await (supabase as any)
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();
  const profile = profileData as User;

  // Auto-upsert the org row (creates it if first member, no-ops on conflict)
  const displayName = getOrgDisplayName(orgDomain);
  await (supabase as any)
    .from("organizations")
    .upsert(
      {
        domain: orgDomain,
        display_name: displayName,
        created_by: authUser.id,
      },
      { onConflict: "domain", ignoreDuplicates: true }
    );

  // Fetch the fresh org record
  const { data: orgData } = await (supabase as any)
    .from("organizations")
    .select("*")
    .eq("domain", orgDomain)
    .single();
  const org = orgData as Organization;

  // Count members (users with the same email domain suffix)
  // Supabase doesn't expose auth.users directly; query our public users table with ilike
  const { count: memberCount } = await (supabase as any)
    .from("users")
    .select("id", { count: "exact", head: true })
    .ilike("email", `%@${orgDomain}`);

  // Fetch member list (limited to 50)
  const { data: membersData } = await (supabase as any)
    .from("users")
    .select("id, username, avatar_url, created_at")
    .ilike("email", `%@${orgDomain}`)
    .order("created_at", { ascending: true })
    .limit(50);

  return (
    <OrgDashboardClient
      org={org}
      profile={profile}
      memberCount={memberCount ?? 0}
      members={(membersData as Partial<User>[]) ?? []}
    />
  );
}
