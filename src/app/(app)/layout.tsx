import type { ReactNode } from "react";

import { hasPlatformAdminAccess, requireAuthenticatedContext } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const { user, workspace } = await requireAuthenticatedContext();
  const userName = user.firstName ?? user.email ?? "Usuario";

  return (
    <AppShell
      title="Operacao"
      userName={userName}
      workspaceName={workspace.name}
      showAdmin={hasPlatformAdminAccess(user)}
    >
      {children}
    </AppShell>
  );
}
