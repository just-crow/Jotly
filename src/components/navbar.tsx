import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PenSquare, LogOut, User, LayoutDashboard, Coins } from "lucide-react";
import type { User as UserType } from "@/lib/types";
import { MobileNav } from "@/components/mobile-nav";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: UserType | null = null;
  if (user) {
    const { data, error } = await (supabase as any)
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!error) {
      profile = data as UserType | null;
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-0 mr-2 md:mr-16">
            <Image
              src="/logo.png"
              alt="Jotly Logo"
              width={108}
              height={72}
              className="h-12 md:h-18 w-auto object-contain dark:invert"
              priority
            />
            <span className="text-xl font-bold tracking-tight">Jotly</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/explore"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/store"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Store
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          {user && profile ? (
            <div className="flex items-center gap-2 md:gap-3">
              <Link
                href="/store"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                title="Points balance"
              >
                <Coins className="h-4 w-4" />
                <span>{profile.points_balance?.toLocaleString() ?? 0}</span>
              </Link>
              <Link href="/editor/new" className="hidden sm:block">
                <Button size="sm" className="gap-2">
                  <PenSquare className="h-4 w-4" />
                  Write
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile.avatar_url || ""}
                        alt={profile.username}
                      />
                      <AvatarFallback>
                        {profile.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action="/auth/signout" method="post">
                      <button className="flex w-full items-center cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Mobile hamburger menu */}
              <MobileNav isLoggedIn profile={profile} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm">Get Started</Button>
              </Link>
              {/* Mobile hamburger menu */}
              <MobileNav isLoggedIn={false} profile={null} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
