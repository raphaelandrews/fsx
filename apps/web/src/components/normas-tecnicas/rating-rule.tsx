import { Badge } from "@fsx/ui/components/badge";

interface RatingRuleProps {
  k: number | string;
  description: React.ReactNode;
}

export function RatingRule({ k, description }: RatingRuleProps) {
  return (
    <li className="flex items-start gap-3 py-3">
      <Badge className="h-6 w-16 shrink-0 bg-accent text-accent-foreground text-sm tabular-nums">k = {k}</Badge>
      <p className="text-base text-reading leading-relaxed">{description}</p>
    </li>
  );
}
