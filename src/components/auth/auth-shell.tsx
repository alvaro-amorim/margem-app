import Link from "next/link";
import { LockKeyhole, ShieldCheck, UserRoundPen } from "lucide-react";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";

const authHighlights = [
  {
    title: "Perfil e foto",
    description: "Atualize avatar, nome e dados de perfil sem sair do app.",
    icon: UserRoundPen,
  },
  {
    title: "Senha e seguranca",
    description: "Gerencie senha, sessoes e verificacoes dentro da sua propria interface.",
    icon: LockKeyhole,
  },
  {
    title: "Acesso consistente",
    description: "Login, cadastro e manutencao de conta com a mesma identidade visual do produto.",
    icon: ShieldCheck,
  },
];

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.08),transparent_30%),linear-gradient(180deg,#fffdf8_0%,#f7f3e7_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:px-6">
        <section className="hidden min-w-0 rounded-[2.5rem] border border-border bg-white/85 p-8 shadow-[0_30px_90px_-50px_rgba(51,65,85,0.45)] backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <AppLogo href="/" size="lg" priority />
            <Badge className="w-fit">Acesso e conta integrados ao app</Badge>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-5xl font-semibold leading-[0.98] tracking-tight text-slate-950">
                Entre, atualize seu perfil e mantenha a conta dentro da experiencia do produto.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                O MARGEM APP agora recebe login, cadastro e manutencao de conta com a mesma linguagem
                visual do painel principal.
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {authHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.75rem] border border-slate-200 bg-[#fcfaf3] p-5"
                >
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Icon className="size-5 text-slate-900" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[2rem] border border-border bg-white/92 p-5 shadow-[0_30px_90px_-50px_rgba(51,65,85,0.45)] backdrop-blur sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <AppLogo href="/" size="md" className="lg:hidden" priority />
              <Link
                href="/"
                className="text-sm font-semibold text-slate-700 underline underline-offset-4"
              >
                Voltar para a pagina inicial
              </Link>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
