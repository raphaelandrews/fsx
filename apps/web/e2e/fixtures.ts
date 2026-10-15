export const E2E_PORT = 4173;
export const E2E_ORIGIN = `http://localhost:${E2E_PORT}`;
export const E2E_SECRET = "e2e-secret-0123456789abcdef0123456789abcdef";
export const OWNER_GITHUB_ID = "1";
export const OWNER_SESSION_TOKEN = "e2e-owner-session-token";
export const PLAYER = { id: 1, name: "Jogadora Teste" };
export const POST = { slug: "noticia-de-teste", title: "Notícia de teste" };

// Mirrors better-call's signCookieValue: HMAC-SHA256(token), base64, URI-encoded.
export async function signedSessionCookie(token: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  const encoded = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return encodeURIComponent(`${token}.${encoded}`);
}
