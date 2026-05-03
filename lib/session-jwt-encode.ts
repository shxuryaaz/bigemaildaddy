import type { JWTEncodeParams } from "@auth/core/jwt";
import { SignJWT } from "jose/jwt/sign";
import { HS_ALG, sessionSecretKey } from "@/lib/session-jwt-secret";

export async function authJwtEncode(
  params: JWTEncodeParams,
): Promise<string> {
  const maxAge = params.maxAge ?? 30 * 24 * 60 * 60;
  const key = sessionSecretKey(params.secret);
  return new SignJWT(params.token ?? {})
    .setProtectedHeader({ alg: HS_ALG })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .sign(key);
}
