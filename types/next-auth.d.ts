import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    expires_at?: number;
  }
}
