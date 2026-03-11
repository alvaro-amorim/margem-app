import { ArrowUpRight, BarChart3, FileText, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const overviewCards = [
  {
    title: "Ingredientes e custos",
    description: "Cadastro com preco atual, historico de compra e custo por unidade base.",
    icon: Wallet,
  },
  {
    title: "Receitas estruturadas",
    description: "Fichas tecnicas com rendimento, porcao vendida e composicao por ingrediente.",
    icon: BarChart3,
  },
  {
    title: "Precificacao por receita",
    description: "Calculo com custos adicionais, margem alvo e historico de simulacoes.",
    icon: ArrowUpRight,
  },
  {
    title: "Base operacional",
    description: "Fluxo pronto para rotina diaria, comparacao e tomada de decisao.",
    icon: FileText,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="gap-3">
          <Badge className="w-fit">Visao geral</Badge>
          <CardTitle className="text-xl sm:text-2xl">Central de gestao do MARGEM APP</CardTitle>
          <CardDescription>
            Acompanhe os pilares do sistema e navegue pelos modulos para cadastrar custos, montar
            receitas e definir precos com mais seguranca.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title}>
              <CardHeader className="gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[color:var(--card-muted)]">
                  <Icon className="size-5 text-slate-900" />
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo recomendado</CardTitle>
            <CardDescription>
              Use esta sequencia para manter o catalogo organizado e a precificacao consistente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>1. Atualize ingredientes sempre que houver mudanca real de compra ou custo.</p>
            <p>2. Estruture receitas com rendimento, porcao e quantidades em unidade base.</p>
            <p>3. Rode simulacoes em Precificacao para comparar preco minimo e preco sugerido.</p>
            <p>4. Consulte o historico salvo para revisar decisoes e ajustar margens.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controle do workspace</CardTitle>
            <CardDescription>
              Os dados operacionais permanecem isolados por workspace em todas as rotas sensiveis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>Catalogo, receitas e runs separados por conta.</p>
            <p>Historico persistido para auditoria e comparacao de preco.</p>
            <p>Calculos executados no servidor, sem depender do front para seguranca.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
