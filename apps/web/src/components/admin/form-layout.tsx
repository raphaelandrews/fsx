import type { FormEvent, ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";

import { Button, buttonVariants } from "@fsx/ui/components/button";

interface AdminFormProps {
  onSubmit: () => void;
  children: ReactNode;
  /** Bottom bar: usually <FormActions />. */
  actions: ReactNode;
}

export function AdminForm({ onSubmit, children, actions }: AdminFormProps) {
  return (
    <form
      noValidate
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="divide-y">{children}</div>
      {actions}
    </form>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** A titled group of fields: title and description on the left, controls on the right. */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="grid gap-x-10 gap-y-4 py-6 first:pt-0 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div>
        <h2 className="font-medium text-sm">{title}</h2>
        {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}

/** Content section without a form, e.g. a related-records table under an edit form. */
export function AdminSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold text-lg">{title}</h2>
          {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

interface FormActionsProps {
  cancelTo: LinkProps["to"];
  submitLabel: string;
  pendingLabel?: string;
  pending: boolean;
  disabled?: boolean;
}

export function FormActions({
  cancelTo,
  submitLabel,
  pendingLabel = "Saving...",
  pending,
  disabled,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2 border-t pt-4">
      <Link to={cancelTo} className={buttonVariants({ variant: "outline" })}>
        Cancel
      </Link>
      <Button type="submit" disabled={pending || disabled}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}
