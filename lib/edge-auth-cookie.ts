/** Minimal cookie parsing for middleware (no deep `@auth/core` imports — blocked by package exports). */

export function parseCookieHeader(header: string): Record<string, string> {
  const jar: Record<string, string> = {};
  if (!header) return jar;
  for (const segment of header.split(";")) {
    const trimmed = segment.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    try {
      jar[name] = decodeURIComponent(value);
    } catch {
      jar[name] = value;
    }
  }
  return jar;
}

/**
 * Reconstructs the Auth.js session JWT from `authjs.session-token` cookies
 * (single or chunked `.0`, `.1`, …), matching `@auth/core` SessionStore behavior.
 */
export function getAuthJsSessionToken(
  cookieHeader: string,
  sessionCookieName: string,
): string {
  const jar = parseCookieHeader(cookieHeader);
  const direct = jar[sessionCookieName];
  if (direct) return direct;

  const prefix = `${sessionCookieName}.`;
  const chunks: { i: number; v: string }[] = [];
  for (const [name, value] of Object.entries(jar)) {
    if (!name.startsWith(prefix) || !value) continue;
    const idx = name.slice(prefix.length);
    if (/^\d+$/.test(idx)) {
      chunks.push({ i: parseInt(idx, 10), v: value });
    }
  }
  if (!chunks.length) return "";
  return chunks
    .sort((a, b) => a.i - b.i)
    .map((c) => c.v)
    .join("");
}
