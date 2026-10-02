import {
  RATE_LIMITS,
  getClientIp,
  isTrustedRequest,
  rateLimit,
  rateLimitedResponse,
} from "@fsx/api/security";
import { applySecurityHeaders } from "@fsx/api/security-headers";
import { createAuth } from "@fsx/auth";
import { createFileRoute } from "@tanstack/react-router";

async function handler({ request }: { request: Request }) {
  if (!isTrustedRequest(request, { requireOrigin: request.method === "POST" })) {
    const response = new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
    applySecurityHeaders(response.headers);
    return response;
  }

  const config = request.method === "POST" ? RATE_LIMITS.authMutation : RATE_LIMITS.authQuery;
  const result = await rateLimit(`auth:${getClientIp(request)}`, config);
  if (!result.ok) {
    console.warn("[security] rate limit exceeded", {
      scope: request.method === "POST" ? "auth-mutation" : "auth-query",
      requestId: request.headers.get("cf-ray") ?? crypto.randomUUID(),
      retryAfter: result.retryAfter,
    });
    const response = rateLimitedResponse(result);
    applySecurityHeaders(response.headers);
    return response;
  }

  const auth = createAuth();
  const response = await auth.handler(request);
  applySecurityHeaders(response.headers);
  return response;
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
