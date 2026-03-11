import { ShieldAlert, UsersRound, Database, Gem, MailMinus } from "lucide-react";

import {
  blockEmailAction,
  blockUserAction,
  deleteUserAction,
  unblockEmailAction,
  unblockUserAction,
  updateWorkspacePlanAction,
} from "@/app/(app)/admin/actions";
import { WorkspacePlan } from "@/generated/prisma/enums";
import { requirePlatformAdminContext } from "@/lib/auth";
import { formatBytes, formatDateTime } from "@/lib/utils";
import { getAdminDashboardData } from "@/server/admin/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const noticeMessages: Record<string, string> = {
  "plan-updated": "Plano do workspace atualizado com sucesso.",
  "user-blocked": "Conta bloqueada com sucesso.",
  "user-unblocked": "Conta desbloqueada com sucesso.",
  "user-deleted": "Conta excluida permanentemente com sucesso.",
  "email-blocked": "Email bloqueado com sucesso.",
  "email-unblocked": "Email removido da blocklist com sucesso.",
};

const errorMessages: Record<string, string> = {
  "plan-invalid": "Nao foi possivel atualizar o plano informado.",
  "user-invalid": "Nao foi possivel localizar o usuario informado.",
  "email-invalid": "Informe um email valido para continuar.",
  "self-block": "Por seguranca, voce nao pode bloquear a propria conta por aqui.",
  "self-delete": "Por seguranca, voce nao pode excluir a propria conta por aqui.",
  "self-email-block": "Por seguranca, voce nao pode bloquear o seu proprio email por aqui.",
};

type AdminPageProps = {
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requirePlatformAdminContext();
  const query = await searchParams;
  const data = await getAdminDashboardData();
  const banner = query.notice
    ? {
        tone: "success" as const,
        message: noticeMessages[query.notice] ?? "Acao administrativa executada com sucesso.",
      }
    : query.error
      ? {
          tone: "error" as const,
          message: errorMessages[query.error] ?? "Nao foi possivel concluir a acao administrativa.",
        }
      : null;

  return (
    <div className="space-y-6">
      {banner ? (
        <div
          className={
            banner.tone === "error"
              ? "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          }
        >
          {banner.message}
        </div>
      ) : null}

      <Card>
        <CardHeader className="gap-3">
          <Badge className="w-fit">Admin</Badge>
          <CardTitle className="text-xl sm:text-2xl">Painel de administracao da plataforma</CardTitle>
          <CardDescription>
            Controle contas, acesso, planos e sinais operacionais do banco em uma camada separada
            do workspace do usuario final.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="gap-3">
            <UsersRound className="size-5 text-slate-900" />
            <CardTitle>Contas criadas</CardTitle>
            <CardDescription>
              {data.overview.totalUsers} contas, {data.overview.blockedUsers} bloqueadas e{" "}
              {data.overview.adminUsers} admins.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <Gem className="size-5 text-slate-900" />
            <CardTitle>Planos</CardTitle>
            <CardDescription>
              {data.overview.premiumWorkspaces} workspaces premium de {data.overview.totalWorkspaces}.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <Database className="size-5 text-slate-900" />
            <CardTitle>Banco de dados</CardTitle>
            <CardDescription>
              Tamanho atual: {formatBytes(data.overview.databaseSizeBytes)}. Uso estimado dos
              workspaces: {formatBytes(data.overview.estimatedWorkspaceUsageBytes)}.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <ShieldAlert className="size-5 text-slate-900" />
            <CardTitle>Blocklist</CardTitle>
            <CardDescription>
              {data.overview.blockedEmails} emails bloqueados para impedir novos acessos.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Bloquear email</CardTitle>
            <CardDescription>
              Impede novos acessos com esse email e bloqueia imediatamente uma conta existente, se
              houver correspondencia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={blockEmailAction} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="email" type="email" placeholder="email@dominio.com" required />
                <Input name="reason" placeholder="Motivo do bloqueio (opcional)" />
              </div>
              <Button type="submit">Adicionar na blocklist</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google login</CardTitle>
            <CardDescription>
              O app ja esta preparado para login social. Quando o provedor Google for ativado no
              Clerk, o botao aparece automaticamente nas telas de entrada e cadastro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>1. Ative o provedor Google na sua aplicacao do Clerk.</p>
            <p>2. Configure o client ID e o client secret do Google OAuth.</p>
            <p>3. O MARGEM APP passa a exibir o botao sem nova mudanca estrutural no front.</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Emails bloqueados</CardTitle>
          <CardDescription>
            Lista atual da blocklist administrativa usada para impedir novos acessos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.blockedEmails.length === 0 ? (
            <div className="rounded-2xl bg-[color:var(--card-muted)] px-4 py-3 text-sm text-slate-700">
              Nenhum email bloqueado ate o momento.
            </div>
          ) : (
            data.blockedEmails.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-3xl bg-[color:var(--card-muted)] p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{item.email}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.reason ?? "Sem motivo informado"} • {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <form action={unblockEmailAction}>
                  <input type="hidden" name="blockedEmailId" value={item.id} />
                  <Button type="submit" variant="outline" size="sm">
                    <MailMinus className="size-4" />
                    Remover bloqueio
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {data.users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="truncate">
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Sem nome"}
                    </CardTitle>
                    <Badge variant="secondary">{user.platformRole}</Badge>
                    <Badge
                      variant={user.status === "BLOCKED" ? "secondary" : "outline"}
                      className={
                        user.status === "BLOCKED" ? "bg-rose-100 text-rose-700" : undefined
                      }
                    >
                      {user.status}
                    </Badge>
                    {user.workspace ? <Badge>{user.workspace.plan}</Badge> : null}
                  </div>
                  <CardDescription className="mt-2">
                    {user.email ?? "Sem email"} • criado em {formatDateTime(user.createdAt)}
                  </CardDescription>
                </div>

                {user.workspace ? (
                  <form action={updateWorkspacePlanAction} className="flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="workspaceId" value={user.workspace.id} />
                    <select
                      name="plan"
                      defaultValue={user.workspace.plan}
                      className="flex h-10 min-w-[140px] rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/15"
                    >
                      <option value={WorkspacePlan.FREE}>FREE</option>
                      <option value={WorkspacePlan.PREMIUM}>PREMIUM</option>
                    </select>
                    <Button type="submit" variant="outline" size="sm">
                      Atualizar plano
                    </Button>
                  </form>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Workspace
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {user.workspace?.name ?? "Sem workspace padrao"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{user.workspace?.slug ?? "—"}</p>
                </div>

                <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Uso estimado
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {formatBytes(user.workspace?.estimatedUsageBytes ?? 0)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Snapshot JSON: {formatBytes(user.workspace?.snapshotBytes ?? 0)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Registros
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Ingredientes: {user.workspace?.ingredientCount ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Receitas: {user.workspace?.recipeCount ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Pricing runs: {user.workspace?.pricingRunCount ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Vinculos
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Memberships: {user.membershipsCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Workspaces proprios: {user.ownedWorkspacesCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Ultima atualizacao: {formatDateTime(user.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
                {user.status === "BLOCKED" ? (
                  <form action={unblockUserAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input type="hidden" name="userId" value={user.id} />
                    <div className="min-w-0 flex-1 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {user.blockedReason ?? "Conta bloqueada pela administracao."}
                    </div>
                    <Button type="submit" variant="outline" size="sm">
                      Desbloquear conta
                    </Button>
                  </form>
                ) : (
                  <form action={blockUserAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input type="hidden" name="userId" value={user.id} />
                    <Input
                      name="reason"
                      placeholder="Motivo do bloqueio (opcional)"
                      className="sm:max-w-sm"
                    />
                    <Button type="submit" variant="outline" size="sm">
                      Bloquear conta
                    </Button>
                  </form>
                )}

                <form action={deleteUserAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Excluir conta
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
