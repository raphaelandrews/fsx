import { cn } from "@/lib/utils";

interface TitulacaoGuidelinesProps {
  intro: React.ReactNode;
  requirements: React.ReactNode;
  note?: React.ReactNode;
  className?: string;
}

export function TitulacaoGuidelines({
  intro,
  requirements,
  note,
  className,
}: TitulacaoGuidelinesProps) {
  return (
    <div className={cn("space-y-4 px-3 pb-3", className)}>
      <div className="text-foreground">{intro}</div>
      <div className="pl-4 border-l-2 border-muted space-y-2 text-foreground">
        {requirements}
      </div>
      {note && (
        <div className="bg-muted/50 p-4 rounded-xs mt-4 text-foreground">
          {note}
        </div>
      )}
    </div>
  );
}
