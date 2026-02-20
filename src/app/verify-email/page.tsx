"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MailCheck, Loader2, RefreshCw, Compass, ArrowRight } from "lucide-react";
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
          <Card className="w-full max-w-lg">
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg"
      >
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <MailCheck className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to {email || "your email"}. Keep this page open, then click the link in your inbox.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>After you verify, you’ll be signed in automatically and redirected to your dashboard.</p>
            <p>If you don’t see the email, check spam or resend it.</p>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={handleResend} disabled={sending || !email}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>
            <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2">
              <Link href="/explore" className="w-full">
                <Button variant="outline" className="w-full">
                  <Compass className="mr-2 h-4 w-4" />
                  Explore notes
                </Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  Go to login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
