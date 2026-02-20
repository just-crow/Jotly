"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, Loader2, RefreshCw, Compass, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [sending, setSending] = useState(false);

  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Email is missing. Please sign up again.");
      return;
    }

    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      toast.error(error.message);
      setSending(false);
      return;
    }

    toast.success("Verification email sent again.");
    setSending(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-2 shadow-xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <CardHeader className="text-center pt-8 pb-4 space-y-4">
            {/* Animated mail icon */}
            <div className="flex justify-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex items-center justify-center"
              >
                <span className="absolute h-20 w-20 rounded-full bg-primary/10 animate-ping opacity-30" />
                <span className="relative flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/30">
                  <Mail className="h-8 w-8 text-primary" />
                </span>
              </motion.div>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
              <CardDescription className="text-base">
                {"We've sent a verification link to"}
              </CardDescription>
              {email && (
                <p className="font-semibold text-foreground text-sm bg-muted rounded-md px-3 py-1.5 inline-block">
                  {email}
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-2 space-y-4">
            <ol className="space-y-2.5">
              {[
                "Open the email we just sent you",
                "Click the verification link inside",
                "You will be signed in automatically",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40 text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground text-center pt-1">
              {"Not seeing it? Check your spam or junk folder."}
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 px-6 pb-6">
            <Button
              className="w-full gap-2"
              onClick={handleResend}
              disabled={sending || !email}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {sending ? "Sending..." : "Resend verification email"}
            </Button>

            <div className="grid w-full grid-cols-2 gap-2">
              <Link href="/explore" className="w-full">
                <Button variant="outline" className="w-full gap-2">
                  <Compass className="h-4 w-4" />
                  Explore
                </Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full gap-2">
                  Login
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
