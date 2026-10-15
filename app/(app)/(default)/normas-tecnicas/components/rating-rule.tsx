import { Badge } from "@/components/ui/badge";
import { DottedSeparator } from "@/components/dotted-separator";
import { cn } from "@/lib/utils";

interface RatingRuleProps {
  k: number | string;
  description: React.ReactNode;
  isLast?: boolean;
}

export function RatingRule({ k, description, isLast }: RatingRuleProps) {
  return (
    <div>
      <div className="m-1">
        <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-all">
          <Badge variant="bulbasaur" className="font-mono rounded-xs shrink-0 w-16">
            <span className="mt-0.5">k = {k}</span>
          </Badge>
          <div className="text-sm text-foreground space-y-1">
            {description}
          </div>
        </div>
      </div>
      {!isLast && <DottedSeparator className="w-full" />}
    </div>
  );
}
