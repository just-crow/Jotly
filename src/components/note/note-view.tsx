import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NoteDownloadButton } from "./note-download-button";
import { sanitizeHtml } from "@/lib/sanitize";
import { Star, ShieldCheck } from "lucide-react";
import type { Note, User, Tag } from "@/lib/types";

interface NoteViewProps {
  note: Note;
  author: User;
  tags: Tag[];
  originalFileUrl?: string | null;
  isExclusive?: boolean;
  isSold?: boolean;
}

export function NoteView({ note, author, tags, originalFileUrl, isExclusive = false, isSold = false }: NoteViewProps) {
  return (
    <article>
      {/* Header */}
      <header className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight break-words">{note.title}</h1>
            {isExclusive && (
              <div>
                {isSold ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-sm">
                    <ShieldCheck className="h-3.5 w-3.5" /> Exclusively Owned
                  </Badge>
                ) : (
                  <Badge className="bg-violet-600 hover:bg-violet-700 gap-1 text-sm">
                    <Star className="h-3.5 w-3.5" /> Exclusive — Full Rights
                  </Badge>
                )}
              </div>
            )}
          </div>
          <NoteDownloadButton
            fileUrl={originalFileUrl}
            fileName={note.original_file_name}
          />
        </div>

        {(note as any).description && (
          <p className="text-base text-foreground leading-relaxed">
            {(note as any).description}
          </p>
        )}

        {note.summary && note.summary !== (note as any).description && (
          <p className="text-sm text-muted-foreground italic">{note.summary}</p>
        )}

        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={author.avatar_url || ""} alt={author.username} />
            <AvatarFallback>
              {author.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{author.username}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(note.created_at), "MMMM d, yyyy")}
              {note.updated_at !== note.created_at &&
                ` · Updated ${format(new Date(note.updated_at), "MMM d, yyyy")}`}
            </p>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <Separator />
      </header>

      {/* Content */}
      <div
        className="prose prose-lg dark:prose-invert max-w-none overflow-x-auto break-words"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content || "") }}
      />
    </article>
  );
}
