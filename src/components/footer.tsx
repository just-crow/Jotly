import Link from "next/link";
import Image from "next/image";
import { Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <span className="text-sm text-muted-foreground ml-5">
            &copy; {new Date().getFullYear()} Veltri. All rights reserved.
          </span>

        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:underline underline-offset-4">
              Privacy Policy
            </Link>
        </div>
      </div>
    </footer>
  );
}
