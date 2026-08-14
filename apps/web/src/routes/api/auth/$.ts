import { RATE_LIMITS, getClientIp, rateLimit, rateLimitedResponse } from "@fsx/api/security";
import { applySecurityHeaders } from "@fsx/api/security-headers";
import { createAuth } from "@fsx/auth";
import { createFileRoute } from "@tanstack/react-router";

async function handler({ request }: { request: Request }) {
  const config = request.method === "POST" ? RATE_LIMITS.authMutation : RATE_LIMITS.authQuery;
  const result = await rateLimit(`auth:${getClientIp(request)}`, config);
  if (!result.ok) {
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
