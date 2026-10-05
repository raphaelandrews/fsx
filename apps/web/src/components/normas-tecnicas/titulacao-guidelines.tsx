import { cn } from "@fsx/ui/lib/utils";

interface TitulacaoGuidelinesProps {
  intro: React.ReactNode;
  requirements: React.ReactNode;
  note?: React.ReactNode;
  className?: string;
}

export function TitulacaoGuidelines({ intro, requirements, note, className }: TitulacaoGuidelinesProps) {
  return (
    <div className={cn("space-y-4 text-reading leading-relaxed", className)}>
      <div>{intro}</div>
      <div className="space-y-2 border-l-2 pl-4">{requirements}</div>
      {note && <div className="rounded-2xl bg-muted p-4 font-semibold text-foreground">{note}</div>}
    </div>
  );
}
