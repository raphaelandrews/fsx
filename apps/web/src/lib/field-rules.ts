import { revalidateLogic } from "@tanstack/react-form";

/** Validate on submit, then on every change, so a fixed field stops showing its error. */
export const submitThenChange = revalidateLogic({ mode: "submit", modeAfterSubmission: "change" });

export const TEXT_MAX = 160;
export const URL_MAX = 2_048;
export const LONG_TEXT_MAX = 500_000;

export function requiredText(label: string, max = TEXT_MAX) {
  return ({ value }: { value: string }) => {
    const trimmed = value.trim();
    if (!trimmed) return `${label} is required`;
    if (trimmed.length > max) return `${label} must be at most ${max} characters`;
    return undefined;
  };
}

export function maxLengthError(label: string, value: string, max: number) {
  return value.trim().length > max ? `${label} must be at most ${max} characters` : undefined;
}

export function httpUrlError(label: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > URL_MAX) return `${label} must be at most ${URL_MAX} characters`;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? undefined : `${label} must start with http:// or https://`;
  } catch {
    return `${label} must be a valid URL`;
  }
}

export function integerError(label: string, value: number, min: number, max: number) {
  return Number.isInteger(value) && value >= min && value <= max
    ? undefined
    : `${label} must be a whole number from ${min} to ${max}`;
}
