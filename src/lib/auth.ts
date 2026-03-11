import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";

import { PlatformRole } from "@/generated/prisma/enums";
import { isClerkConfigured, isDatabaseConfigured } from "@/lib/env";
import {
  getPersistedAuthenticatedContext,
  isBlockedAccessError,
  syncClerkUserFromSession,
} from "@/server/tenancy";

export function hasPlatformAdminAccess(user: {
  platformRole: PlatformRole;
}) {
  return user.platformRole === PlatformRole.ADMIN;
}

function ensureWorkspaceContext<T extends { workspace: unknown | null }>(
  context: T,
): asserts context is T & { workspace: NonNullable<T["workspace"]> } {
  if (!context.workspace) {
    redirect("/sign-in");
  }
}

export const requireAuthenticatedContext = cache(async function requireAuthenticatedContext() {
  if (!isClerkConfigured()) {
    redirect("/?setup=clerk");
  }

  if (!isDatabaseConfigured()) {
    redirect("/?setup=database");
  }

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  try {
    const persistedContext = await getPersistedAuthenticatedContext(userId);

    if (persistedContext) {
      ensureWorkspaceContext(persistedContext);
      return persistedContext;
    }

    const clerkUser = await currentUser();

    if (!clerkUser) {
      redirect("/sign-in");
    }

    const syncedContext = await syncClerkUserFromSession(clerkUser);
    ensureWorkspaceContext(syncedContext);
    return syncedContext;
  } catch (error) {
    if (isBlockedAccessError(error)) {
      redirect("/blocked");
    }

    throw error;
  }
});

export const requirePlatformAdminContext = cache(async function requirePlatformAdminContext() {
  const context = await requireAuthenticatedContext();

  if (!hasPlatformAdminAccess(context.user)) {
    redirect("/dashboard");
  }

  return context;
});
