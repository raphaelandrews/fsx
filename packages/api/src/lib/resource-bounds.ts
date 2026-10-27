export const PUBLIC_COLLECTION_LIMIT = 1000;
export const PUBLIC_NESTED_COLLECTION_LIMIT = 250;
export const PUBLIC_RESPONSE_SIZE_BUDGET_BYTES = 512 * 1024;
// The rate limiters count HTTP requests, so an unbounded batch would multiply every limit by its length.
export const MAX_BATCH_SIZE = 10;

export function measureResponseBytes(responseText: string): number {
  return new TextEncoder().encode(responseText).byteLength;
}
