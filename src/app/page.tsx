import Link from "next/link";
import {
  ArrowRight,
  ChartColumnIncreasing,
  NotebookPen,
  PackageSearch,
  Sparkles,
} from "lucide-react";

import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    title: "Catalogo organizado",
    description: "Ingredientes com custo base, historico de preco, marca e local de compra.",
    icon: PackageSearch,
  },
  {
    title: "Receitas conectadas",
    description: "Fichas tecnicas ligadas aos ingredientes reais do workspace.",
    icon: NotebookPen,
  },
  {
    title: "Margem orientada por dados",
    description: "Calculo por lote, porcao, custo adicional e preco sugerido.",
    icon: ChartColumnIncreasing,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.08),transparent_30%),linear-gradient(180deg,#fffdf8_0%,#f7f3e7_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-border bg-white/85 px-5 py-5 shadow-[0_24px_80px_-40px_rgba(51,65,85,0.45)] backdrop-blur sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <AppLogo href="/" size="md" priority />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-auto">
            <Button asChild variant="ghost" className="w-full">
              <Link href="/sign-in">Entrar</Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/dashboard">Abrir painel</Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center lg:py-6">
          <div className="min-w-0 space-y-6">
            <Badge className="w-fit max-w-full">
              <Sparkles className="mr-1 size-3.5 shrink-0" />
              Gestao de custos e margem em um so lugar
            </Badge>

            <div className="space-y-4">
              <h2 className="max-w-4xl text-4xl font-semibold leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Precifique receitas com clareza, controle operacional e visao de margem.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                O MARGEM APP organiza ingredientes, receitas e custos adicionais para transformar
                dados do dia a dia em decisoes de preco mais seguras.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/dashboard">
                  Acessar painel
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/sign-up">Criar conta</Link>
              </Button>
            </div>
          </div>

          <Card className="bg-slate-950 text-white">
            <CardHeader className="space-y-3">
              <Badge variant="outline" className="w-fit border-white/20 text-white">
                Painel operacional
              </Badge>
              <CardTitle className="text-xl text-white sm:text-2xl">
                Controle custos, porcoes e preco sugerido
              </CardTitle>
              <CardDescription className="text-slate-300">
                Trabalhe com ficha tecnica, historico de compra e simulacoes salvas no mesmo fluxo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-200">
              <p>Ingredientes com rastreio de preco e custo por unidade base.</p>
              <p>Receitas estruturadas com rendimento, porcao e composicao.</p>
              <p>Precificacao por receita com historico de calculos salvos.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 pb-4 sm:grid-cols-2 xl:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title}>
                <CardHeader className="gap-3">
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
