import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isClerkConfigured, isDatabaseConfigured } from "@/lib/env";
import {
  getPersistedAuthenticatedContext,
  syncClerkUserFromSession,
} from "@/server/tenancy";

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

  const persistedContext = await getPersistedAuthenticatedContext(userId);

  if (persistedContext) {
    return persistedContext;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  return syncClerkUserFromSession(clerkUser);
});
