"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import type { UserReview } from "@/lib/types";

interface LeaveReviewFormProps {
  reviewedUserId: string;
  reviewerUserId: string;
  existingReview?: UserReview | null;
  onSaved?: (review: UserReview) => void;
  onDeleted?: () => void;
}

export function LeaveReviewForm({
  reviewedUserId,
  reviewerUserId,
  existingReview,
  onSaved,
  onDeleted,
}: LeaveReviewFormProps) {
  const supabase = createClient();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    setSaving(true);
    try {
      if (existingReview) {
        const { data, error } = await (supabase as any)
          .from("user_reviews")
          .update({ rating, comment: comment.trim() || null, updated_at: new Date().toISOString() })
          .eq("id", existingReview.id)
          .select()
          .single();

        if (error) throw error;
        toast.success("Review updated!");
        onSaved?.(data as UserReview);
      } else {
        const { data, error } = await (supabase as any)
          .from("user_reviews")
          .insert({
            reviewer_id: reviewerUserId,
            reviewed_user_id: reviewedUserId,
            rating,
            comment: comment.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success("Review posted!");
        onSaved?.(data as UserReview);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    setDeleting(true);
    try {
      const { error } = await (supabase as any)
        .from("user_reviews")
        .delete()
        .eq("id", existingReview.id);
      if (error) throw error;
      toast.success("Review removed");
      onDeleted?.();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete review");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Star picker */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= (hovered || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground self-center">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
          </span>
        )}
      </div>

      <Textarea
        placeholder="Share your experience (optional)…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={500}
      />

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || rating === 0}
          className="gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {existingReview ? "Update Review" : "Post Review"}
        </Button>
        {existingReview && (
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:text-destructive gap-2"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
