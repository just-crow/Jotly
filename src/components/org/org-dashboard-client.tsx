"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Tag,
  Info,
  Loader2,
  Save,
  CheckCircle2,
} from "lucide-react";
import type { User, Organization } from "@/lib/types";
import { motion } from "framer-motion";

interface OrgDashboardClientProps {
  org: Organization;
  profile: User;
  memberCount: number;
  members: Partial<User>[];
}

export function OrgDashboardClient({
  org,
  profile,
  memberCount,
  members,
}: OrgDashboardClientProps) {
  const supabase = createClient();
  const [discount, setDiscount] = useState(org.discount_percent);
  const [inputValue, setInputValue] = useState(String(org.discount_percent));
  const [saving, setSaving] = useState(false);
  const [savedValue, setSavedValue] = useState(org.discount_percent);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0 && n <= 100) setDiscount(n);
  };

  const handleSliderChange = (val: number) => {
    setDiscount(val);
    setInputValue(String(val));
  };

  const handleSave = async () => {
    const clamped = Math.max(0, Math.min(100, discount));
    setSaving(true);
    const { error } = await (supabase as any)
      .from("organizations")
      .update({ discount_percent: clamped, updated_at: new Date().toISOString() })
      .eq("domain", org.domain);

    if (error) {
      toast.error(error.message);
    } else {
      setSavedValue(clamped);
      setDiscount(clamped);
      setInputValue(String(clamped));
      toast.success("Discount updated!");
    }
    setSaving(false);
  };

  const discountChanged = discount !== savedValue;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{org.display_name}</h1>
          <p className="text-sm text-muted-foreground">{org.domain}</p>
        </div>
        <Badge variant="secondary" className="ml-auto gap-1">
          <Users className="h-3.5 w-3.5" />
          {memberCount} member{memberCount !== 1 ? "s" : ""}
        </Badge>
      </motion.div>

      <Separator />

      {/* Discount card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Member Discount
          </CardTitle>
          <CardDescription>
            Set a percentage discount that applies automatically when any{" "}
            <strong>@{org.domain}</strong> member purchases a note. Stacks with
            the existing 5% points-payment discount.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={discount}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full accent-primary h-2 rounded-lg"
              />
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                max={100}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-20 text-center text-lg font-bold"
              />
              <span className="text-lg font-bold text-muted-foreground">%</span>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-muted/40 border px-4 py-3 space-y-1 text-sm">
            <p className="font-medium">Example: $10.00 note</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Dollar payment</span>
              <span className="font-semibold text-foreground">
                ${(10 * (1 - discount / 100)).toFixed(2)}
                {discount > 0 && (
                  <span className="ml-1.5 text-xs text-emerald-500 font-normal">
                    −{discount}%
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Points payment (extra 5% off)</span>
              <span className="font-semibold text-foreground">
                {Math.ceil(10 * (1 - discount / 100) * 0.95 * 100).toLocaleString()} pts
                {discount > 0 && (
                  <span className="ml-1.5 text-xs text-emerald-500 font-normal">
                    −{discount + 5 - discount * 0.05 | 0}%
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || !discountChanged}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : discountChanged ? (
                <Save className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {saving ? "Saving…" : discountChanged ? "Save Discount" : "Up to date"}
            </Button>
            {discount > 0 && (
              <Button
                variant="ghost"
                onClick={() => handleSliderChange(0)}
                disabled={saving}
              >
                Remove discount
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-muted">
        <CardContent className="pt-5 flex gap-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/60" />
          <p>
            Any user whose account email ends with <strong>@{org.domain}</strong> is
            automatically a member of {org.display_name}. The discount is visible
            to them on the purchase page of every paid note. Only members of this
            organization can change the discount — there is no super-admin; the
            setting is shared and any member can update it.
          </p>
        </CardContent>
      </Card>

      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Members on Veltri
            <Badge variant="outline" className="ml-1">{memberCount}</Badge>
          </CardTitle>
          <CardDescription>
            Registered users with an <strong>@{org.domain}</strong> email
            {memberCount > 50 && " — showing first 50"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No members found.
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Link href={`/u/${m.username}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={m.avatar_url ?? ""}
                        alt={m.username}
                      />
                      <AvatarFallback className="text-xs">
                        {m.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <Link
                    href={`/u/${m.username}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {m.username}
                  </Link>
                  {m.id === profile.id && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
