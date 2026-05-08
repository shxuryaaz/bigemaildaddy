/**
 * Google OAuth (Google Cloud Console → APIs & Services → Credentials → OAuth client)
 *
 * Authorized JavaScript origins:
 *   - http://localhost:3000
 *   - https://YOUR_PRODUCTION_DOMAIN   (e.g. https://bigemaildaddy.vercel.app)
 *
 * Authorized redirect URIs (Auth.js default callback path):
 *   - http://localhost:3000/api/auth/callback/google
 *   - https://YOUR_PRODUCTION_DOMAIN/api/auth/callback/google
 *
 * Enable Google People API is not required for basic profile; Gmail API must be
 * enabled on the GCP project for gmail.send scope to work end-to-end.
 *
 * Env: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET (generate with openssl rand -base64 32)
 *
 * Local dev: open the app only as http://localhost:3000 (same as AUTH_URL). Using
 * 127.0.0.1:3000 breaks OAuth cookies and causes invalid_grant / Invalid code verifier.
 *
 * Do not link to GET /api/auth/signin/google — Auth.js rejects that as Unsupported action.
 * Use `signIn("google", { redirectTo })` from a Server Action (see app/(marketing)/actions.ts)
 * or POST via the default /api/auth/signin page.
 *
 * Profile bootstrap: use `events.signIn`, not `callbacks.signIn`. Auth.js invokes
 * `callbacks.signIn` before the Prisma user exists for new OAuth sign-ins (FK error on
 * profiles). `events.signIn` runs after persistence so `user.id` is a real `users.id`.
 */

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
  },
  /**
   * Do not create Profile in `callbacks.signIn` — Auth.js runs that *before*
   * `handleLoginOrRegister`, so new OAuth users still have provider `sub` as
   * `user.id` and no `users` row yet → FK violation on `profiles_user_id_fkey`.
   * `events.signIn` runs after the user is persisted.
   */
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      try {
        await prisma.profile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
      } catch (err) {
        console.error("[auth] profile upsert failed", err);
      }
    },
  },
});
