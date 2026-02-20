"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save, KeyRound, Eye, EyeOff, Building2 } from "lucide-react";
import Link from "next/link";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { UserReviewsList } from "@/components/profile/user-reviews-list";
import type { ReviewWithReviewer } from "@/components/profile/user-reviews-list";
import { getOrgDomain, getOrgDisplayName } from "@/lib/org-utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // org
  const orgDomain = profile ? getOrgDomain(profile.email) : null;
  const orgName = orgDomain ? getOrgDisplayName(orgDomain) : null;

  // reviews
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([]);
  const [avgRating, setAvgRating] = useState(0);

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await (supabase as any)
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      const profileData = data as User | null;
      if (profileData) {
        setProfile(profileData);
        setUsername(profileData.username);
        setBio(profileData.bio || "");
        setAvatarUrl(profileData.avatar_url || "");

        const { data: reviewData } = await (supabase as any)
          .from("user_reviews")
          .select("*, reviewer:reviewer_id(id, username, avatar_url)")
          .eq("reviewed_user_id", profileData.id)
          .order("created_at", { ascending: false });

        if (reviewData && reviewData.length > 0) {
          const mapped = (reviewData as any[]).map((r: any) => ({
            ...r,
            reviewer: r.reviewer,
          })) as ReviewWithReviewer[];
          setReviews(mapped);
          const avg = mapped.reduce((acc, r) => acc + r.rating, 0) / mapped.length;
          setAvgRating(avg);
        }
      }
      setLoading(false);
    };
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    setSaving(true);

    if (username !== profile.username) {
      const { data: existingUser } = await (supabase as any)
        .from("users")
        .select("id")
        .eq("username", username)
        .neq("id", profile.id)
        .single();

      if (existingUser) {
        toast.error("Username is already taken");
        setSaving(false);
        return;
      }
    }

    const { error } = await (supabase as any)
      .from("users")
      .update({ username, bio: bio || null, avatar_url: avatarUrl || null })
      .eq("id", profile.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated!");
      router.refresh();
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPw(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Tabs defaultValue="settings">
        <TabsList className="mb-6">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="reviews">
            My Reviews
            {reviews.length > 0 && (
              <span className="ml-1.5 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                {reviews.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== SETTINGS TAB ===== */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your public information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                {profile && (
                  <AvatarUploader
                    userId={profile.id}
                    currentUrl={avatarUrl}
                    username={username}
                    onUploaded={setAvatarUrl}
                  />
                )}
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p className="font-medium text-foreground">{username || "Your name"}</p>
                  <p>{profile?.email}</p>
                  {orgDomain && orgName ? (
                    <Link
                      href="/org"
                      className="inline-flex items-center gap-1.5 mt-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Building2 className="h-3 w-3" />
                      {orgName} org member · Manage
                    </Link>
                  ) : (
                    <p className="mt-1 text-xs">Click avatar to upload &amp; crop</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email || ""} disabled className="opacity-60" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Set a new password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changingPw || !newPassword}
                variant="secondary"
                className="gap-2"
              >
                {changingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== REVIEWS TAB ===== */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Reviews I&apos;ve Received</CardTitle>
              <CardDescription>
                What others have said about you.{" "}
                {profile && (
                  <a href={`/u/${profile.username}`} className="underline text-primary" target="_blank" rel="noopener noreferrer">
                    View public profile 
                  </a>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserReviewsList reviews={reviews} avgRating={avgRating} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
