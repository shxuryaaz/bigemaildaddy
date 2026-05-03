import type { JWT, JWTDecodeParams } from "@auth/core/jwt";
import { jwtVerify } from "jose/jwt/verify";
import { HS_ALG, sessionSecretKey } from "@/lib/session-jwt-secret";

/** Edge middleware: import only this module so `jose/jwt/sign` (and JWE) stay out of the bundle. */
export async function authJwtDecode(
  params: JWTDecodeParams,
): Promise<JWT | null> {
  if (!params.token) return null;
  try {
    const key = sessionSecretKey(params.secret);
    const { payload } = await jwtVerify(params.token, key, {
      algorithms: [HS_ALG],
    });
    return payload as JWT;
  } catch {
    return null;
  }
}
