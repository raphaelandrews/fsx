import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { Label } from "@fsx/ui/components/label";

import { cn } from "@fsx/ui/lib/utils";

interface FormFieldProps {
  /** Visible label text shown above the control. */
  label: string;
  htmlFor?: string;
  /** First validation message for the field; renders below the control. */
  error?: string | false | undefined;
  /** Optional helper text shown under the control (always visible). */
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Shared labelled field used across the admin forms to keep labels, hint text
 * and inline validation errors consistent. Children should be a single form
 * control wired to a TanStack Form field.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {error && htmlFor && isValidElement(children)
        ? cloneElement(children as ReactElement<Record<string, unknown>>, {
            "aria-invalid": true,
            "aria-describedby": `${htmlFor}-error`,
          })
        : children}
      {hint && <p id={htmlFor ? `${htmlFor}-hint` : undefined} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}
