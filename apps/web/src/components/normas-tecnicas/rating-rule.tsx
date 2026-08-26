import { Badge } from "@fsx/ui/components/badge";

interface RatingRuleProps {
  k: number | string;
  description: React.ReactNode;
}

export function RatingRule({ k, description }: RatingRuleProps) {
  return (
    <div className="m-1">
      <div className="flex items-center gap-3 p-3 transition-all hover:bg-muted/50">
        <Badge className="w-16 shrink-0 rounded-xs bg-bulbasaur font-mono text-bulbasaur-foreground">
          <span className="mt-0.5">k = {k}</span>
        </Badge>
        <div className="space-y-1 text-sm text-foreground">{description}</div>
      </div>
    </div>
  );
}
