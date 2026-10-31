// The largest legitimate bodies are image uploads sent as base64 in JSON: 2 MB visitor photos and 5 MB admin photos.
export const BODY_LIMITS = {
  auth: 16 * 1024,
  anonymousTrpc: 3 * 1024 * 1024,
  sessionTrpc: 8 * 1024 * 1024,
} as const;

/**
 * Returns the request to hand to the router, or null when its body is over `maxBytes`.
 * Content-Length is client-supplied and chunked bodies have none, so a body without a length is counted as it is read.
 */
export async function limitRequestBody(request: Request, maxBytes: number): Promise<Request | null> {
  if (!request.body) return request;
  const declared = request.headers.get("Content-Length");
  if (declared !== null) {
    const length = Number(declared);
    if (!Number.isFinite(length) || length > maxBytes) return null;
    return request;
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Request(request.url, { method: request.method, headers: request.headers, body });
}

export function payloadTooLargeResponse(): Response {
  return new Response(JSON.stringify({ error: "Request body too large." }), {
    status: 413,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
