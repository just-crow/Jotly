"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX, Shield } from "lucide-react";

interface NoteQualityPanelProps {
  score: number | null;
  feedback: string | null;
}

function getQualityConfig(score: number | null) {
  if (score === null) return null;
  if (score >= 8)
    return {
      label: "High Quality",
      color: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950/40 dark:border-green-800 dark:text-green-200",
      barColor: "bg-green-500",
      iconColor: "text-green-600 dark:text-green-400",
      Icon: ShieldCheck,
    };
  if (score >= 5)
    return {
      label: "Moderate Quality",
      color: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200",
      barColor: "bg-amber-500",
      iconColor: "text-amber-600 dark:text-amber-400",
      Icon: ShieldAlert,
    };
  return {
    label: "Needs Improvement",
    color: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200",
    barColor: "bg-red-500",
    iconColor: "text-red-600 dark:text-red-400",
    Icon: ShieldX,
  };
}

export function NoteQualityPanel({ score, feedback }: NoteQualityPanelProps) {
  const config = getQualityConfig(score);

  if (!config || !score) return null;

  const { label, color, barColor, iconColor, Icon } = config;
  const pct = Math.round((score / 10) * 100);
  const stars = Math.round(score / 2);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.15 }}
      className={`rounded-xl border p-5 space-y-4 sticky top-24 ${color}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
        <span className="font-semibold text-sm">{label}</span>
      </div>

      {/* Score number + stars */}
      <div className="space-y-1.5">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold leading-none">{score}</span>
          <span className="text-sm opacity-70 mb-0.5">/ 10</span>
        </div>
        <div className="flex gap-0.5 text-lg leading-none">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < stars ? "" : "opacity-30"}>
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>

      {/* Feedback */}
      {feedback && (
        <p className="text-xs leading-relaxed opacity-80">{feedback}</p>
      )}
    </motion.aside>
  );
}
