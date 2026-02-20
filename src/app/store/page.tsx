import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StoreClient } from "@/components/store/store-client";

export const metadata = {
  title: "Points Store",
};

export default async function StorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await (supabase as any)
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: transactions } = await (supabase as any)
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <StoreClient
        pointsBalance={profile?.points_balance ?? 0}
        dollarBalance={Number(profile?.dollar_balance) || 0}
        initialTransactions={(transactions as any) ?? []}
      />
    </div>
  );
}
