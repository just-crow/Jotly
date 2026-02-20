"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { Send, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Comment, User } from "@/lib/types";

interface CommentsSectionProps {
  noteId: string;
  initialComments: (Comment & { users: User })[];
  currentUserId: string | null;
}

export function CommentsSection({
  noteId,
  initialComments,
  currentUserId,
}: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    setSubmitting(true);

    const { data, error } = await (supabase as any)
      .from("comments")
      .insert({
        note_id: noteId,
        user_id: currentUserId,
        content: newComment.trim(),
      })
      .select("*, users(*)")
      .single();

    if (error) {
      toast.error("Failed to post comment");
      setSubmitting(false);
      return;
    }

    setComments([...comments, data as Comment & { users: User }]);
    setNewComment("");
    setSubmitting(false);
    toast.success("Comment posted!");
  };

  const handleDelete = async (commentId: string) => {
    // Optimistic removal with rollback on error
    const previousComments = [...comments];
    setComments(comments.filter((c) => c.id !== commentId));

    const { error } = await (supabase as any)
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      setComments(previousComments);
      toast.error("Failed to delete comment");
      return;
    }

    toast.success("Comment deleted");
  };

  return (
    <div className="mt-12 space-y-6">
      <Separator />
      <h2 className="text-2xl font-bold">
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-muted-foreground text-sm">
          Sign in to leave a comment.
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment, i) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3 p-4 rounded-lg border"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={comment.users?.avatar_url || ""}
                alt={comment.users?.username}
              />
              <AvatarFallback>
                {comment.users?.username?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate max-w-[140px]">
                    {comment.users?.username}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(comment.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                {currentUserId === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          </motion.div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
}
