import { cn } from "@fsx/ui/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}


export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("pt-8 pb-6 sm:pt-12 sm:pb-8 text-center", className)}>
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mx-auto mt-3 max-w-2xl text-base text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
