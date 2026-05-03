import type {
  JWT,
  JWTDecodeParams,
  JWTEncodeParams,
} from "@auth/core/jwt";
import { SignJWT, jwtVerify } from "jose";

const HS_ALG = "HS256" as const;

function secretKey(secret: string | string[]) {
  const s = Array.isArray(secret) ? secret[0] : secret;
  if (!s) throw new Error("AUTH_SECRET is required for session JWT");
  return new TextEncoder().encode(s);
}

/** HS256 JWS (Edge-safe). Default Auth.js JWE pulls `jose` deflate → unsupported Edge APIs in middleware. */
export async function authJwtEncode(
  params: JWTEncodeParams,
): Promise<string> {
  const maxAge = params.maxAge ?? 30 * 24 * 60 * 60;
  const key = secretKey(params.secret);
  return new SignJWT(params.token ?? {})
    .setProtectedHeader({ alg: HS_ALG })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .sign(key);
}

export async function authJwtDecode(
  params: JWTDecodeParams,
): Promise<JWT | null> {
  if (!params.token) return null;
  try {
    const key = secretKey(params.secret);
    const { payload } = await jwtVerify(params.token, key, {
      algorithms: [HS_ALG],
    });
    return payload as JWT;
  } catch {
    return null;
  }
}
