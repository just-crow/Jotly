"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { BookOpen, CalendarDays, MessageSquarePlus, Star, Edit3 } from "lucide-react";
import type { Note, User, UserReview } from "@/lib/types";
import type { ReviewWithReviewer } from "@/components/profile/user-reviews-list";
import { UserReviewsList, StarDisplay } from "@/components/profile/user-reviews-list";
import { LeaveReviewForm } from "@/components/profile/leave-review-form";
import { NoteScoreBadge } from "@/components/note/note-score-badge";
import { NotePriceBadge } from "@/components/note/note-price-badge";
import { motion } from "framer-motion";

interface PublicProfileClientProps {
  profileUser: User;
  notes: Note[];
  reviews: ReviewWithReviewer[];
  avgRating: number;
  viewerId: string | null;
  isOwnProfile: boolean;
  existingReview: ReviewWithReviewer | null;
}

export function PublicProfileClient({
  profileUser,
  notes,
  reviews: initialReviews,
  avgRating: initialAvg,
  viewerId,
  isOwnProfile,
  existingReview: initialExistingReview,
}: PublicProfileClientProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [existingReview, setExistingReview] = useState<ReviewWithReviewer | null>(
    initialExistingReview
  );
  const [showReviewForm, setShowReviewForm] = useState(false);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  const handleReviewSaved = (saved: UserReview) => {
    // We don't have full reviewer info here at save time, but we can use
    // existingReview's reviewer or construct a placeholder
    const reviewerInfo = existingReview?.reviewer ?? {
      id: viewerId!,
      username: "you",
      avatar_url: null,
    };
    const rich: ReviewWithReviewer = {
      ...(saved as any),
      reviewer: existingReview?.reviewer ?? (reviewerInfo as User),
    };

    if (existingReview) {
      setReviews((prev) => prev.map((r) => (r.id === saved.id ? rich : r)));
    } else {
      setReviews((prev) => [rich, ...prev]);
    }
    setExistingReview(rich);
    setShowReviewForm(false);
  };

  const handleReviewDeleted = () => {
    if (!existingReview) return;
    setReviews((prev) => prev.filter((r) => r.id !== existingReview.id));
    setExistingReview(null);
    setShowReviewForm(false);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-5"
      >
        <Avatar className="h-20 w-20 shrink-0">
          <AvatarImage src={profileUser.avatar_url ?? ""} alt={profileUser.username} />
          <AvatarFallback className="text-2xl">
            {profileUser.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1">
          <h1 className="text-2xl font-bold truncate">{profileUser.username}</h1>
          {profileUser.bio && (
            <p className="text-muted-foreground text-sm">{profileUser.bio}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Joined {format(new Date(profileUser.created_at), "MMM yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {notes.length} note{notes.length !== 1 ? "s" : ""}
            </span>
            {avgRating > 0 && (
              <StarDisplay rating={avgRating} count={reviews.length} size="sm" />
            )}
          </div>
        </div>

        {isOwnProfile && (
          <Link href="/profile">
            <Button variant="outline" size="sm" className="gap-2 shrink-0">
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        )}
      </motion.div>

      <Separator />

      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({reviews.length})
          </TabsTrigger>
        </TabsList>

        {/* ---- Notes tab ---- */}
        <TabsContent value="notes" className="mt-6">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No published notes yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {notes.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/note/${profileUser.username}/${note.slug}`}>
                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                          {note.title}
                        </CardTitle>
                        {note.summary && (
                          <CardDescription className="line-clamp-2 text-xs">
                            {note.summary}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <NoteScoreBadge
                            noteId={note.id}
                            preloadedScore={note.validation_score}
                          />
                          <NotePriceBadge
                            price={note.price}
                            isExclusive={note.is_exclusive}
                            isSold={note.is_sold}
                          />
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(note.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- Reviews tab ---- */}
        <TabsContent value="reviews" className="mt-6 space-y-6">
          {/* Leave / edit review — only for logged-in non-owners */}
          {!isOwnProfile && viewerId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {existingReview ? (
                    <>
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      Your Review
                    </>
                  ) : (
                    <>
                      <MessageSquarePlus className="h-4 w-4" />
                      Leave a Review
                    </>
                  )}
                </CardTitle>
                {existingReview && !showReviewForm && (
                  <CardDescription>
                    You rated {profileUser.username}{" "}
                    <strong>{existingReview.rating}/5</strong>.{" "}
                    <button
                      className="underline text-primary text-xs"
                      onClick={() => setShowReviewForm(true)}
                    >
                      Edit
                    </button>
                  </CardDescription>
                )}
              </CardHeader>
              {(!existingReview || showReviewForm) && (
                <CardContent>
                  <LeaveReviewForm
                    reviewedUserId={profileUser.id}
                    reviewerUserId={viewerId}
                    existingReview={existingReview}
                    onSaved={handleReviewSaved}
                    onDeleted={handleReviewDeleted}
                  />
                </CardContent>
              )}
            </Card>
          )}

          {!isOwnProfile && !viewerId && (
            <div className="text-sm text-muted-foreground text-center py-4">
              <Link href="/login" className="underline text-primary">
                Sign in
              </Link>{" "}
              to leave a review.
            </div>
          )}

          <UserReviewsList reviews={reviews} avgRating={avgRating} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
