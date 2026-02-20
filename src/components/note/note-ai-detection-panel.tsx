"use client";

import { motion } from "framer-motion";
import { Bot, UserRound, AlertTriangle } from "lucide-react";

interface NoteAiDetectionPanelProps {
  label: string | null;
  score: number | null;
  isLikelyAi: boolean | null;
  summary: string | null;
}

export function NoteAiDetectionPanel({
  label,
  score,
  isLikelyAi,
  summary,
}: NoteAiDetectionPanelProps) {
  if (!summary || score === null || isLikelyAi === null) return null;

  const pct = Math.round(score * 100);

  const config = isLikelyAi
    ? {
        heading: "Likely AI-Generated",
        color:
          "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-200",
        barColor: "bg-orange-500",
        iconColor: "text-orange-600 dark:text-orange-400",
        Icon: Bot,
      }
    : {
        heading: "Likely Human-Written",
        color:
          "bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200",
        barColor: "bg-sky-500",
        iconColor: "text-sky-600 dark:text-sky-400",
        Icon: UserRound,
      };

  const { heading, color, barColor, iconColor, Icon } = config;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.25 }}
      className={`rounded-xl border p-5 space-y-4 ${color}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
        <span className="font-semibold text-sm">AI Content Detection</span>
      </div>

      {/* Result + confidence */}
      <div className="space-y-1">
        <p className="text-lg font-bold leading-tight">{heading}</p>
        <p className="text-2xl font-bold leading-none">{pct}%</p>
        <p className="text-xs opacity-70">confidence — {label ?? summary}</p>
      </div>

      {/* Confidence bar */}
      <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-1.5 pt-1 border-t border-black/10 dark:border-white/10">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60" />
        <p className="text-xs opacity-70 leading-relaxed">
          AI detection is not 100% accurate and may produce false results. Use
          this as a guide only.
        </p>
      </div>
    </motion.aside>
  );
}
