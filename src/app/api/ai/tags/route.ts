import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { puterPrompt } from "@/lib/puter-ai";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    // Rate limit: 10 requests per minute
    const rlKey = getRateLimitKey(request, "ai-tags");
    const rl = rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const prompt = `You are a content tagger. Read the following text and suggest 3 to 5 highly relevant tags/keywords that categorize this content. 

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text) with this format:
{"tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}

Each tag should be a single word or short phrase (max 2-3 words), lowercase, relevant to the content topic.

Text to tag:
${content.substring(0, 4000)}`;

    const responseText = await puterPrompt(prompt, {
      temperature: 0.3,
      maxTokens: 260,
    });

    // Extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { tags: ["general"] }
      );
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const tags = Array.isArray(parsed.tags)
        ? parsed.tags.slice(0, 5).map((t: string) => String(t).toLowerCase().trim())
        : ["general"];
      return NextResponse.json({ tags });
    } catch {
      return NextResponse.json({ tags: ["general"] });
    }
  } catch (error: any) {
    console.error("Tag suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to suggest tags: " + error.message },
      { status: 500 }
    );
  }
}
