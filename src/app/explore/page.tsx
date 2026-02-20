import { createClient } from "@/lib/supabase/server";
import { ExploreClient } from "@/components/explore/explore-client";

export const metadata = {
  title: "Explore",
  description: "Discover recently published notes from the community.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const supabase = await createClient();
  const page = parseInt(pageParam || "1", 10);
  const perPage = 12;
  const offset = (page - 1) * perPage;

  let query = (supabase as any)
    .from("notes")
    .select(
      "id, title, slug, summary, raw_markdown, created_at, validation_score, validation_feedback, original_file_name, original_file_type, price, is_exclusive, is_sold, users(id, username, avatar_url)",
      { count: "exact" }
    )
    .eq("is_published", true)
    // Hide exclusive notes that have already been sold (off the market)
    .or("is_exclusive.eq.false,is_sold.eq.false")
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (q) {
    query = query.textSearch("fts", q, { type: "websearch" });
  }

  const { data: notes, count } = await query;

  // Fetch avg ratings for all authors in this page
  const userRatings: Record<string, number> = {};
  const userIds = [
    ...new Set(
      ((notes as any[]) ?? [])
        .map((n: any) => n.users?.id)
        .filter(Boolean) as string[]
    ),
  ];
  if (userIds.length > 0) {
    const { data: ratingsData } = await (supabase as any)
      .from("user_reviews")
      .select("reviewed_user_id, rating")
      .in("reviewed_user_id", userIds);
    if (ratingsData) {
      const grouped: Record<string, number[]> = {};
      for (const r of ratingsData as { reviewed_user_id: string; rating: number }[]) {
        if (!grouped[r.reviewed_user_id]) grouped[r.reviewed_user_id] = [];
        grouped[r.reviewed_user_id].push(r.rating);
      }
      for (const [uid, ratings] of Object.entries(grouped)) {
        userRatings[uid] = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ExploreClient
        initialNotes={(notes as any) ?? []}
        initialQuery={q || ""}
        totalCount={count || 0}
        currentPage={page}
        perPage={perPage}
        userRatings={userRatings}
      />
    </div>
  );
}
