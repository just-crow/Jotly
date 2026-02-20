"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { format } from "date-fns";
import type { UserReview, User } from "@/lib/types";
import Link from "next/link";

export type ReviewWithReviewer = UserReview & { reviewer: User };

interface UserReviewsListProps {
  reviews: ReviewWithReviewer[];
  avgRating: number;
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${
            s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export function StarDisplay({
  rating,
  count,
  size = "sm",
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}) {
  if (!rating) return null;
  return (
    <span className="flex items-center gap-1">
      <StarRow rating={Math.round(rating)} size={size} />
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)}{count !== undefined ? ` (${count})` : ""}
      </span>
    </span>
  );
}

export function UserReviewsList({ reviews, avgRating }: UserReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No reviews yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
        <span className="text-3xl font-bold">{avgRating.toFixed(1)}</span>
        <div className="space-y-1">
          <StarRow rating={Math.round(avgRating)} size="md" />
          <p className="text-xs text-muted-foreground">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Individual reviews */}
      {reviews.map((review) => (
        <div key={review.id} className="flex gap-3">
          <Link href={`/u/${review.reviewer.username}`} className="shrink-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={review.reviewer.avatar_url ?? ""} alt={review.reviewer.username} />
              <AvatarFallback>{review.reviewer.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/u/${review.reviewer.username}`}
                className="font-medium text-sm hover:underline"
              >
                {review.reviewer.username}
              </Link>
              <StarRow rating={review.rating} />
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), "MMM d, yyyy")}
              </span>
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
