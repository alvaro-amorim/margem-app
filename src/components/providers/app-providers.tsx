import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import { clerkAppearance } from "@/lib/clerk-theme";
import { isClerkConfigured } from "@/lib/env";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  if (!isClerkConfigured()) {
    return children;
  }

  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      {children}
    </ClerkProvider>
  );
}
