import { DottedSeparator } from "@/components/dotted-separator";
import { cn } from "@/lib/utils";

interface SobreItemProps {
  children: React.ReactNode;
  isLast?: boolean;
  className?: string;
}

export function SobreItem({ children, isLast, className }: SobreItemProps) {
  return (
    <div>
      <div className="m-1">
        <div className={cn("p-3 hover:bg-muted/50 transition-all", className)}>
          {children}
        </div>
      </div>
      {!isLast && <DottedSeparator className="w-full" />}
    </div>
  );
}
