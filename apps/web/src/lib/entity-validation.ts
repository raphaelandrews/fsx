import type { EntityField } from "@/components/admin/entity-form";

import { httpUrlError, LONG_TEXT_MAX, maxLengthError, TEXT_MAX, URL_MAX } from "./field-rules";

export function maxLengthOf(field: EntityField) {
  if (field.maxLength) return field.maxLength;
  if (field.kind === "textarea") return LONG_TEXT_MAX;
  if (field.kind === "url") return URL_MAX;
  return TEXT_MAX;
}

export function validateField(field: EntityField, value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return field.required ? `${field.label} is required` : undefined;
  switch (field.kind) {
    case "number": {
      const number = Number(trimmed);
      if (!Number.isInteger(number)) return `${field.label} must be a whole number`;
      if (field.min !== undefined && number < field.min) return `${field.label} must be at least ${field.min}`;
      if (field.max !== undefined && number > field.max) return `${field.label} must be at most ${field.max}`;
      return undefined;
    }
    case "url":
      return httpUrlError(field.label, trimmed);
    case "text":
    case "textarea":
      return maxLengthError(field.label, trimmed, maxLengthOf(field));
    default:
      return undefined;
  }
}
