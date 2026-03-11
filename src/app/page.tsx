import Link from "next/link";
import { ArrowRight, ChartColumnIncreasing, NotebookPen, PackageSearch, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    title: "Catálogo organizado",
    description: "Ingredientes com custo base, histórico de preço, marca e local de compra.",
    icon: PackageSearch,
  },
  {
    title: "Receitas conectadas",
    description: "Fichas técnicas ligadas aos ingredientes reais do workspace.",
    icon: NotebookPen,
  },
  {
    title: "Margem orientada por dados",
    description: "Cálculo por lote, porção, custo adicional e preço sugerido.",
    icon: ChartColumnIncreasing,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.08),transparent_30%),linear-gradient(180deg,#fffdf8_0%,#f7f3e7_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:px-6">
        <header className="flex items-center justify-between rounded-[2rem] border border-border bg-white/85 px-6 py-4 shadow-[0_24px_80px_-40px_rgba(51,65,85,0.45)] backdrop-blur">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              MARGEM APP
            </p>
            <h1 className="text-xl font-semibold text-slate-950">
              Calculadora de precificação
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/sign-in">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Abrir painel</Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-6 py-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Badge className="w-fit">
              <Sparkles className="mr-1 size-3.5" />
              Gestão de custos e margem em um só lugar
            </Badge>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                Precifique receitas com clareza, controle operacional e visão de margem.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                O MARGEM APP organiza ingredientes, receitas e custos adicionais para transformar
                dados do dia a dia em decisões de preço mais seguras.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Acessar painel
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-up">Criar conta</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden bg-slate-950 text-white">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-white/20 text-white">
                Painel operacional
              </Badge>
              <CardTitle className="text-2xl text-white">
                Controle custos, porções e preço sugerido
              </CardTitle>
              <CardDescription className="text-slate-300">
                Trabalhe com ficha técnica, histórico de compra e simulações salvas no mesmo fluxo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-200">
              <p>Ingredientes com rastreio de preço e custo por unidade base.</p>
              <p>Receitas estruturadas com rendimento, porção e composição.</p>
              <p>Precificação por receita com histórico de cálculos salvos.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 pb-8 md:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title}>
                <CardHeader>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[color:var(--card-muted)]">
                    <Icon className="size-5 text-slate-900" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
