const HS_ALG = "HS256" as const;

export { HS_ALG };

export function sessionSecretKey(secret: string | string[]) {
  const s = Array.isArray(secret) ? secret[0] : secret;
  if (!s) throw new Error("AUTH_SECRET is required for session JWT");
  return new TextEncoder().encode(s);
}
