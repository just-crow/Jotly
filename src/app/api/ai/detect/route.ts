import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { detectAiText } from "@/lib/ai-detection";

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const rlKey = getRateLimitKey(request, "ai-detect");
    const rl = rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { content } = await request.json();
    if (!content || String(content).trim().length < 40) {
      return NextResponse.json(
        { error: "Content is too short for AI detection" },
        { status: 400 }
      );
    }

    const result = await detectAiText(String(content));
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Detection failed";
    console.error("AI detection error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
