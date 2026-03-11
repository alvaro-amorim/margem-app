import { ArrowUpRight, BarChart3, FileText, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const overviewCards = [
  {
    title: "Ingredientes e custos",
    description: "Cadastro com preço atual, histórico de compra e custo por unidade base.",
    icon: Wallet,
  },
  {
    title: "Receitas estruturadas",
    description: "Fichas técnicas com rendimento, porção vendida e composição por ingrediente.",
    icon: BarChart3,
  },
  {
    title: "Precificação por receita",
    description: "Cálculo com custos adicionais, margem alvo e histórico de simulações.",
    icon: ArrowUpRight,
  },
  {
    title: "Base operacional",
    description: "Fluxo pronto para rotina diária, comparação e tomada de decisão.",
    icon: FileText,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Badge className="w-fit">Visão geral</Badge>
          <CardTitle className="text-2xl">Central de gestão do MARGEM APP</CardTitle>
          <CardDescription>
            Acompanhe os pilares do sistema e navegue pelos módulos para cadastrar custos, montar
            receitas e definir preços com mais segurança.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title}>
              <CardHeader>
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

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo recomendado</CardTitle>
            <CardDescription>
              Use esta sequência para manter o catálogo organizado e a precificação consistente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>1. Atualize ingredientes sempre que houver mudança real de compra ou custo.</p>
            <p>2. Estruture receitas com rendimento, porção e quantidades em unidade base.</p>
            <p>3. Rode simulações em Precificação para comparar preço mínimo e preço sugerido.</p>
            <p>4. Consulte o histórico salvo para revisar decisões e ajustar margens.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controle do workspace</CardTitle>
            <CardDescription>
              Os dados operacionais permanecem isolados por workspace em todas as rotas sensíveis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>Catálogo, receitas e runs separados por conta.</p>
            <p>Histórico persistido para auditoria e comparação de preço.</p>
            <p>Cálculos executados no servidor, sem depender do front para segurança.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
