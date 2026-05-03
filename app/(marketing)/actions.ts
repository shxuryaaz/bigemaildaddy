"use server";

import { signIn } from "@/lib/auth";

export async function signInWithGoogleToDashboard() {
  await signIn("google", { redirectTo: "/dashboard" });
}
