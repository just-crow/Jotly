import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

const POINTS_PER_DOLLAR = 100;
const MIN_PURCHASE_DOLLARS = 10;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 5 purchases per minute
    const rlKey = getRateLimitKey(request, "buy-points");
    const rl = rateLimit(rlKey, { limit: 5, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { amount } = await request.json();

    if (!amount || typeof amount !== "number" || amount < MIN_PURCHASE_DOLLARS) {
      return NextResponse.json(
        { error: `Minimum purchase is $${MIN_PURCHASE_DOLLARS}` },
        { status: 400 }
      );
    }

    const pointsToCredit = Math.floor(amount * POINTS_PER_DOLLAR);

    // ---- MOCK PAYMENT ----
    // In production, this would call Stripe/PayPal/etc.
    const paymentSuccess = true;
    if (!paymentSuccess) {
      return NextResponse.json(
        { error: "Payment failed" },
        { status: 402 }
      );
    }
    // ---- END MOCK ----

    // Atomic DB transaction: credit points + record transaction
    const { data, error } = await (supabase as any).rpc("buy_points", {
      p_user_id: user.id,
      p_amount: amount,
      p_points: pointsToCredit,
    });

    if (error) {
      console.error("buy_points rpc error:", error);
      return NextResponse.json(
        { error: "Failed to credit points" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      points_credited: data.points_credited,
      new_balance: data.new_balance,
      amount_charged: amount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Purchase failed" },
      { status: 500 }
    );
  }
}
