import { HugeiconsIcon } from "@hugeicons/react";
import { Book01Icon } from "@hugeicons/core-free-icons";

interface NormasItemProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function NormasItem({ title, description, children }: NormasItemProps) {
  return (
    <div className="m-1">
      <div className="flex flex-col gap-2 p-3 text-left">
        <div className="flex items-center gap-2">
          <HugeiconsIcon className="size-3.5 text-muted-foreground" icon={Book01Icon} />
          <h3 className="text-sm leading-tight font-bold">{title}</h3>
        </div>
        {description ? (
          <p className="text-xs font-normal text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}
