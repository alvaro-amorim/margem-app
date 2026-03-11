import type { ReactNode } from "react";

import { requireAuthenticatedContext } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const { user, workspace } = await requireAuthenticatedContext();
  const userName = user.firstName ?? user.email ?? "Usuário";

  return (
    <AppShell title="Operação" userName={userName} workspaceName={workspace.name}>
      {children}
    </AppShell>
  );
}
