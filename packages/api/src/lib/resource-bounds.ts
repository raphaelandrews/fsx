export const PUBLIC_COLLECTION_LIMIT = 500;
export const PUBLIC_NESTED_COLLECTION_LIMIT = 100;
export const PUBLIC_RESPONSE_SIZE_BUDGET_BYTES = 512 * 1024;

export function measureResponseBytes(responseText: string): number {
  return new TextEncoder().encode(responseText).byteLength;
}
