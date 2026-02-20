import { Badge } from "@/components/ui/badge";

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
      <Badge className="bg-violet-600 hover:bg-violet-700 text-xs">
        Excl. ${Number(price).toFixed(2)}
      </Badge>
    );
  }

  return (
    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-xs">
      ${Number(price).toFixed(2)}
    </Badge>
  );
}
