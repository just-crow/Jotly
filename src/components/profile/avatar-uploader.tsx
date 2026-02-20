"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Loader2, ZoomIn, ZoomOut } from "lucide-react";

// ---- constants ----
const CANVAS_SIZE = 320; // display canvas px (square)
const CIRCLE_RADIUS = 140; // crop circle radius on canvas

interface AvatarUploaderProps {
  userId: string;
  currentUrl: string;
  username: string;
  onUploaded: (newUrl: string) => void;
}

export function AvatarUploader({
  userId,
  currentUrl,
  username,
  onUploaded,
}: AvatarUploaderProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const isDragging = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // ---- draw canvas ----
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = CANVAS_SIZE;
    const h = CANVAS_SIZE;
    ctx.clearRect(0, 0, w, h);

    // Draw image
    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;
    const ix = w / 2 + offset.x - scaledW / 2;
    const iy = h / 2 + offset.y - scaledH / 2;
    ctx.drawImage(img, ix, iy, scaledW, scaledH);

    // Dark overlay with circular hole using even-odd fill rule
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    // counterclockwise arc → punches a hole via even-odd
    ctx.arc(w / 2, h / 2, CIRCLE_RADIUS, 0, 2 * Math.PI, true);
    ctx.fill("evenodd");
    ctx.restore();

    // Circle border
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, CIRCLE_RADIUS, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }, [zoom, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ---- load image ----
  const loadImage = (src: string) => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Set minimum zoom so image covers the crop circle
      const mz = Math.max(
        (CIRCLE_RADIUS * 2) / img.naturalWidth,
        (CIRCLE_RADIUS * 2) / img.naturalHeight
      );
      const initZoom = Math.max(mz, 1);
      setMinZoom(mz);
      setZoom(initZoom);
      setOffset({ x: 0, y: 0 });
      draw();
    };
    img.src = src;
  };

  useEffect(() => {
    if (imgSrc) loadImage(imgSrc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSrc]);

  // ---- file input ----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgSrc(ev.target?.result as string);
      setOpen(true);
    };
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  // ---- pointer events (works for mouse + touch) ----
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || !lastPos.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    lastPos.current = null;
  };

  // ---- zoom via wheel ----
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((prev) => Math.max(minZoom, Math.min(4, prev + delta)));
  };

  // ---- export cropped image and upload ----
  const handleUpload = async () => {
    const img = imgRef.current;
    if (!img) return;

    setUploading(true);
    try {
      const EXPORT_SIZE = 400;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = EXPORT_SIZE;
      exportCanvas.height = EXPORT_SIZE;
      const ctx = exportCanvas.getContext("2d")!;

      // Clip to circle
      ctx.beginPath();
      ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, EXPORT_SIZE / 2, 0, 2 * Math.PI);
      ctx.clip();

      // Map canvas pixel (CANVAS_SIZE/2, CANVAS_SIZE/2) → image pixel
      const imgLeft = CANVAS_SIZE / 2 + offset.x - (img.naturalWidth * zoom) / 2;
      const imgTop = CANVAS_SIZE / 2 + offset.y - (img.naturalHeight * zoom) / 2;
      const imgCX = (CANVAS_SIZE / 2 - imgLeft) / zoom;
      const imgCY = (CANVAS_SIZE / 2 - imgTop) / zoom;
      const imgR = CIRCLE_RADIUS / zoom;

      ctx.drawImage(
        img,
        imgCX - imgR,
        imgCY - imgR,
        imgR * 2,
        imgR * 2,
        0,
        0,
        EXPORT_SIZE,
        EXPORT_SIZE
      );

      exportCanvas.toBlob(
        async (blob) => {
          if (!blob) {
            toast.error("Failed to export image");
            setUploading(false);
            return;
          }

          const filePath = `${userId}/avatar.jpg`;
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, blob, {
              upsert: true,
              contentType: "image/jpeg",
            });

          if (uploadError) {
            toast.error(uploadError.message);
            setUploading(false);
            return;
          }

          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          // Cache-bust so the new avatar shows immediately
          const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

          const { error: updateError } = await (supabase as any)
            .from("users")
            .update({ avatar_url: publicUrl })
            .eq("id", userId);

          if (updateError) {
            toast.error(updateError.message);
          } else {
            onUploaded(publicUrl);
            setOpen(false);
            setImgSrc("");
            toast.success("Avatar updated!");
          }
          setUploading(false);
        },
        "image/jpeg",
        0.92
      );
    } catch (err) {
      toast.error("Upload failed");
      setUploading(false);
    }
  };

  return (
    <>
      {/* Trigger: clicking the avatar or camera button */}
      <div className="relative group inline-block">
        <Avatar className="h-20 w-20 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <AvatarImage src={currentUrl} alt={username} />
          <AvatarFallback className="text-2xl">
            {username?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
          aria-label="Change avatar"
        >
          <Camera className="h-5 w-5 text-white" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* Crop Dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setImgSrc("");
          setOpen(v);
        }}
      >
        <DialogContent className="max-w-sm w-full p-4">
          <DialogHeader>
            <DialogTitle>Crop Avatar</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Drag to reposition · Scroll or use the slider to zoom
            </p>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="rounded-lg border cursor-grab active:cursor-grabbing touch-none w-full"
              style={{ maxWidth: CANVAS_SIZE, aspectRatio: "1/1" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
            />

            {/* Zoom slider */}
            <div className="flex items-center gap-2 w-full">
              <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="range"
                min={minZoom}
                max={4}
                step={0.02}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </div>

          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setImgSrc("");
                setOpen(false);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button className="flex-1 gap-2" onClick={handleUpload} disabled={uploading || !imgSrc}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Save Avatar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
