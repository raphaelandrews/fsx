import { fieldError } from "@/lib/errors";

type FieldLike = Parameters<typeof fieldError>[0];

/** Client validation message, else the server's message for this field, below its control. */
export function FieldError({ field, error }: { field: FieldLike; error: unknown }) {
  const message = fieldError(field, error);
  if (!message) return null;
  return (
    <p id={`${field.name}-error`} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}
