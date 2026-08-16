import { cn } from "@fsx/ui/lib/utils"

interface TitulacaoGuidelinesProps {
  intro: React.ReactNode
  requirements: React.ReactNode
  note?: React.ReactNode
  className?: string
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
      <div className="space-y-2 border-l-2 border-muted pl-4 text-foreground">
        {requirements}
      </div>
      {note && (
        <div className="mt-4 rounded-xs bg-muted/50 p-4 text-foreground">
          {note}
        </div>
      )}
    </div>
  )
}
