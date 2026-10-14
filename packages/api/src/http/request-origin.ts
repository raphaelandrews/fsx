function toOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isTrustedOrigin(input: {
  origin: string | null;
  requestUrl: string;
  configuredOrigin: string | null | undefined;
  requireOrigin?: boolean;
}): boolean {
  if (!input.origin) return input.requireOrigin !== true;
  const requestOrigin = toOrigin(input.origin);
  if (!requestOrigin) return false;
  return (
    requestOrigin === new URL(input.requestUrl).origin ||
    requestOrigin === toOrigin(input.configuredOrigin)
  );
}
