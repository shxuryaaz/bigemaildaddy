import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const googleScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");

export default {
  trustHost: true,
  /** PKCE uses encrypted cookies; mismatched host or secret causes "Invalid code verifier". Web + client_secret does not need PKCE. */
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      checks: ["state"],
      authorization: {
        params: {
          scope: googleScopes,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token ?? undefined;
        token.refreshToken = account.refresh_token ?? undefined;
        token.expires_at = account.expires_at ?? undefined;
      }
      if (user) {
        token.sub = user.id;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;
