import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import { isClerkConfigured } from "@/lib/env";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  if (!isClerkConfigured()) {
    return children;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
