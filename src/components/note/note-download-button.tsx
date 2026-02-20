"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface NoteDownloadButtonProps {
  fileUrl?: string | null;
  fileName?: string | null;
}

export function NoteDownloadButton({
  fileUrl,
  fileName,
}: NoteDownloadButtonProps) {
  if (!fileUrl || !fileName) return null;

  return (
    <Button variant="outline" size="sm" asChild className="gap-2 shrink-0">
      <a href={fileUrl} download={fileName} target="_blank">
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Download Original</span>
      </a>
    </Button>
  );
}
