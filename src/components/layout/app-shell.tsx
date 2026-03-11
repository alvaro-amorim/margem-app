import type { ReactNode } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BellRing, ChevronRight } from "lucide-react";

import { isClerkConfigured } from "@/lib/env";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type AppShellProps = {
  children: ReactNode;
  title: string;
  workspaceName: string;
  userName: string;
};

export function AppShell({
  children,
  title,
  workspaceName,
  userName,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_30%),linear-gradient(180deg,#fffdf8_0%,#f7f4ea_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[280px_1fr] lg:px-6">
        <aside className="rounded-[2rem] border border-border bg-white/90 p-4 shadow-[0_30px_80px_-40px_rgba(148,163,184,0.55)] backdrop-blur lg:p-6">
          <div className="flex items-center justify-end lg:hidden">
            {isClerkConfigured() ? <UserButton /> : null}
          </div>

          <div className="hidden space-y-4 lg:block">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-foreground text-background">
                MA
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  MARGEM APP
                </p>
                <h1 className="text-lg font-semibold text-slate-900">
                  Calculadora de precificação
                </h1>
              </div>
            </Link>

            <Badge variant="secondary" className="w-fit">
              Gestão de custos
            </Badge>
          </div>

          <Separator className="my-6 hidden lg:block" />

          <SidebarNav />

          <div className="mt-6 hidden rounded-3xl bg-[color:var(--card-muted)] p-5 lg:block">
            <p className="text-sm font-semibold text-slate-900">{workspaceName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ambiente ativo para catalogar ingredientes, receitas e cálculos.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <header className="hidden rounded-[2rem] border border-border bg-white/80 px-6 py-5 shadow-[0_30px_80px_-40px_rgba(148,163,184,0.55)] backdrop-blur md:flex md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>MARGEM APP</span>
                <ChevronRight className="size-4" />
                <span>{title}</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
                <p className="text-sm text-muted-foreground">Conta ativa: {userName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" aria-label="Notificações">
                <BellRing className="size-4" />
              </Button>
              {isClerkConfigured() ? <UserButton /> : null}
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
