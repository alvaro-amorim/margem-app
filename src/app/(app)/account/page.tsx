import { UserProfile } from "@clerk/nextjs";
import { Camera, KeyRound, ShieldCheck } from "lucide-react";

import { clerkProfileAppearance } from "@/lib/clerk-theme";
import { isClerkConfigured } from "@/lib/env";
import { requireAuthenticatedContext } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const accountHighlights = [
  {
    title: "Foto de perfil",
    description: "Envie ou troque o avatar usado no topo do app.",
    icon: Camera,
  },
  {
    title: "Senha e acesso",
    description: "Atualize a senha e revise os fatores de seguranca disponiveis.",
    icon: KeyRound,
  },
  {
    title: "Sessoes ativas",
    description: "Gerencie dispositivos conectados sem sair da interface do painel.",
    icon: ShieldCheck,
  },
];

export default async function AccountPage() {
  const { workspace } = await requireAuthenticatedContext();

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
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="gap-3">
            <Badge className="w-fit">Minha conta</Badge>
            <CardTitle className="text-xl sm:text-2xl">
              Perfil e seguranca dentro do MARGEM APP
            </CardTitle>
            <CardDescription>
              Ajuste foto, senha e detalhes da sua conta sem sair do dominio do aplicativo.
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

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {accountHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title}>
                <CardHeader className="gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:var(--card-muted)]">
                    <Icon className="size-5 text-slate-900" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar conta</CardTitle>
          <CardDescription>
            Atualize dados pessoais, foto, senha, seguranca e sessoes ativas em uma tela interna.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserProfile
            routing="path"
            path="/account"
            appearance={clerkProfileAppearance}
          />
        </CardContent>
      </Card>
    </div>
  );
}
