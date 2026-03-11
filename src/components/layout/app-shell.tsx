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
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_30%),linear-gradient(180deg,#fffdf8_0%,#f7f4ea_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 px-3 py-3 sm:px-4 md:gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 lg:px-6">
        <aside className="min-w-0 rounded-[2rem] border border-border bg-white/90 p-3 shadow-[0_30px_80px_-40px_rgba(148,163,184,0.55)] backdrop-blur sm:p-4 lg:p-6">
          <div className="flex items-center justify-end sm:hidden">
            {isClerkConfigured() ? <UserButton /> : null}
          </div>

          <div className="hidden items-center justify-between gap-4 sm:flex lg:hidden">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span className="truncate">MARGEM APP</span>
                <ChevronRight className="size-3.5 shrink-0" />
                <span className="truncate">{title}</span>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">{userName}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Notificacoes">
                <BellRing className="size-4" />
              </Button>
              {isClerkConfigured() ? <UserButton /> : null}
            </div>
          </div>

          <div className="hidden space-y-4 lg:block">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-foreground text-background">
                MA
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  MARGEM APP
                </p>
                <h1 className="truncate text-lg font-semibold text-slate-900">
                  Calculadora de precificacao
                </h1>
              </div>
            </Link>

            <Badge variant="secondary" className="w-fit">
              Gestao de custos
            </Badge>
          </div>

          <Separator className="my-4 hidden lg:block" />

          <SidebarNav />

          <div className="mt-4 hidden rounded-3xl bg-[color:var(--card-muted)] p-5 lg:block">
            <p className="truncate text-sm font-semibold text-slate-900">{workspaceName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ambiente ativo para catalogar ingredientes, receitas e calculos.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4 md:gap-5 lg:gap-6">
          <header className="hidden rounded-[2rem] border border-border bg-white/80 px-6 py-5 shadow-[0_30px_80px_-40px_rgba(148,163,184,0.55)] backdrop-blur lg:flex lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>MARGEM APP</span>
                <ChevronRight className="size-4 shrink-0" />
                <span className="truncate">{title}</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
                <p className="truncate text-sm text-muted-foreground">Conta ativa: {userName}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Button variant="outline" size="icon" aria-label="Notificacoes">
                <BellRing className="size-4" />
              </Button>
              {isClerkConfigured() ? <UserButton /> : null}
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
