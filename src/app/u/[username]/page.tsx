import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { User, Note } from "@/lib/types";
import type { ReviewWithReviewer } from "@/components/profile/user-reviews-list";
import { PublicProfileClient } from "@/components/profile/public-profile-client";

interface PublicProfileProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PublicProfileProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data } = await (supabase as any)
    .from("users")
    .select("username, bio, avatar_url")
    .eq("username", username)
    .single();

  if (!data) return { title: "User Not Found" };
  return {
    title: `${data.username} — Veltri`,
    description: data.bio ?? `View ${data.username}'s notes and profile on Veltri.`,
    openGraph: {
      title: data.username,
      description: data.bio ?? "",
      images: data.avatar_url ? [data.avatar_url] : [],
    },
  };
}

export default async function PublicProfilePage({ params }: PublicProfileProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Profile
  const { data: profileData } = await (supabase as any)
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  const profileUser = profileData as User | null;
  if (!profileUser) notFound();

  // Published notes by this user
  const { data: notesData } = await (supabase as any)
    .from("notes")
    .select(
      "id, title, slug, summary, created_at, validation_score, price, is_exclusive, is_sold, original_file_name, original_file_type"
    )
    .eq("user_id", profileUser.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  // Reviews with reviewer info
  const { data: reviewsData } = await (supabase as any)
    .from("user_reviews")
    .select("*, reviewer:reviewer_id(id, username, avatar_url)")
    .eq("reviewed_user_id", profileUser.id)
    .order("created_at", { ascending: false });

  const reviews = ((reviewsData as any[]) ?? []).map((r: any) => ({
    ...r,
    reviewer: r.reviewer,
  })) as ReviewWithReviewer[];

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  // Current viewer
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const viewerData = authUser
    ? await (supabase as any)
        .from("users")
        .select("id")
        .eq("id", authUser.id)
        .single()
        .then((r: any) => r.data as { id: string } | null)
    : null;

  const viewerId = viewerData?.id ?? null;
  const isOwnProfile = viewerId === profileUser.id;

  // Viewer's existing review (if any)
  const existingReview = viewerId
    ? reviews.find((r) => r.reviewer_id === viewerId) ?? null
    : null;

  return (
    <PublicProfileClient
      profileUser={profileUser}
      notes={(notesData as Note[]) ?? []}
      reviews={reviews}
      avgRating={avgRating}
      viewerId={viewerId}
      isOwnProfile={isOwnProfile}
      existingReview={existingReview}
    />
  );
}
