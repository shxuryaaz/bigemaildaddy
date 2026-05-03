import type { Profile, User } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type UserWithProfile = User & { profile: Profile | null };

export class UnauthorizedError extends Error {
  readonly statusCode = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function getCurrentUser(): Promise<UserWithProfile | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });
  return user;
}

export async function requireUser(): Promise<UserWithProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
