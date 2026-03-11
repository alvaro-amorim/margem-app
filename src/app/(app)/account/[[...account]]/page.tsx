import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Camera, KeyRound, ShieldCheck } from "lucide-react";
import { UserProfile } from "@clerk/nextjs";

import { clerkProfileAppearance } from "@/lib/clerk-theme";
import { isClerkConfigured } from "@/lib/env";
import { requireAuthenticatedContext } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const accountLinks = [
  {
    title: "Trocar foto e dados",
    description: "Abra o perfil para atualizar nome, foto e informacoes da conta.",
    href: "/account",
    icon: Camera,
    cta: "Abrir perfil",
    highlightSection: true,
  },
  {
    title: "Alterar senha",
    description: "Revise senha, verificacoes e fatores extras de seguranca.",
    href: "/account/security",
    icon: KeyRound,
    cta: "Abrir seguranca",
    highlightSection: true,
  },
  {
    title: "Ver sessoes ativas",
    description: "Consulte dispositivos conectados e encerre sessoes quando precisar.",
    href: "/account/security",
    icon: ShieldCheck,
    cta: "Ver sessoes",
    highlightSection: false,
  },
] as const;

type AccountPageProps = {
  params: Promise<{
    account?: string[];
  }>;
};

function getSectionTitle(section: string) {
  if (section === "security") {
    return "Seguranca da conta";
  }

  return "Perfil da conta";
}

function getSectionDescription(section: string) {
  if (section === "security") {
    return "Gerencie senha, verificacoes, dispositivos conectados e rotinas de seguranca.";
  }

  return "Atualize foto, nome e informacoes usadas em toda a experiencia do app.";
}

export default async function AccountPage({ params }: AccountPageProps) {
  const [{ account }, { workspace }] = await Promise.all([params, requireAuthenticatedContext()]);
  const activeSection = account?.[0] === "security" ? "security" : "account";

  if (account?.[0] === "account") {
    redirect("/account");
  }

  if (!isClerkConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conta indisponivel</CardTitle>
          <CardDescription>
            O gerenciamento de conta depende do Clerk configurado neste ambiente.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="gap-3">
            <Badge className="w-fit">Minha conta</Badge>
            <CardTitle className="text-xl sm:text-2xl">
              Perfil e seguranca dentro do MARGEM APP
            </CardTitle>
            <CardDescription>
              Gerencie foto de perfil, senha, seguranca e sessoes ativas sem sair do dominio do
              aplicativo.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace ativo</CardTitle>
            <CardDescription>
              Suas alteracoes de perfil ficam disponiveis junto ao workspace atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-2xl bg-[color:var(--card-muted)] px-4 py-3 text-sm font-medium text-slate-900">
              {workspace.name}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {accountLinks.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.highlightSection &&
            ((activeSection === "account" && item.href === "/account") ||
              (activeSection === "security" && item.href === "/account/security"));

          return (
            <Link key={`${item.title}-${item.href}`} href={item.href} className="min-w-0">
              <Card
                className={cn(
                  "h-full transition-transform hover:-translate-y-0.5",
                  isActive && "border-slate-900 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.42)]",
                )}
              >
                <CardHeader className="gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:var(--card-muted)]">
                      <Icon className="size-5 text-slate-900" />
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-slate-400" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                  <div className="pt-1">
                    <Button variant={isActive ? "default" : "outline"} size="sm" className="w-full">
                      {isActive ? "Secao aberta" : item.cta}
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </section>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{getSectionTitle(activeSection)}</CardTitle>
          <CardDescription>{getSectionDescription(activeSection)}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden p-0 sm:p-0">
          <UserProfile routing="path" path="/account" appearance={clerkProfileAppearance} />
        </CardContent>
      </Card>
    </div>
  );
}
