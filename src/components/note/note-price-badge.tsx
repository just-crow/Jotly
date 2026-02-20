"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NotePriceBadgeProps {
  price: number;
  isExclusive?: boolean;
  isSold?: boolean;
}

export function NotePriceBadge({ price, isExclusive = false, isSold = false }: NotePriceBadgeProps) {
  if (isExclusive && isSold) {
    return <Badge variant="destructive" className="text-xs">SOLD</Badge>;
  }

  if (!price || price <= 0) {
    return <Badge variant="secondary" className="text-xs">Free</Badge>;
  }

  if (isExclusive) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-violet-600 hover:bg-violet-700 text-xs cursor-help">
              Excl. ${Number(price).toFixed(2)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-72 text-xs leading-relaxed">
            <p>
              <strong>Exclusive Rights</strong> — The creator has declared that this content is
              entirely original and has not been published anywhere on the internet, including
              submission to anti-plagiarism services such as Turnitin, iThenticate, or similar
              platforms. By purchasing, you receive full and sole ownership.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-xs">
      ${Number(price).toFixed(2)}
    </Badge>
  );
}
