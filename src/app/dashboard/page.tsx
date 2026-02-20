import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: notes } = await (supabase as any)
    .from("notes")
    .select("*, users(*)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const { data: profile } = await (supabase as any)
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch purchased notes
  const { data: purchasedData } = await (supabase as any)
    .from("purchases")
    .select("*, notes(*, users(*))")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const purchasedNotes = (purchasedData ?? []).map((p: any) => ({
    ...p.notes,
    purchase_date: p.created_at,
    price_paid: p.price_paid,
    payment_method: p.payment_method,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardClient
        initialNotes={(notes as any) ?? []}
        profile={profile as any}
        pointsBalance={(profile as any)?.points_balance ?? 0}
        dollarBalance={Number((profile as any)?.dollar_balance) || 0}
        purchasedNotes={purchasedNotes}
      />
    </div>
  );
}
