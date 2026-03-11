import Link from "next/link";
import { ArrowRight, Clock3, History, LineChart, ReceiptText } from "lucide-react";

import { savePricingRunAction } from "@/app/(app)/pricing/actions";
import { PricingForm } from "@/components/pricing/pricing-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateRecipePricing } from "@/features/pricing/engine";
import {
  requireAuthenticatedContext,
} from "@/lib/auth";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/lib/utils";
import {
  getRecipePricingContext,
  listRecipePricingRuns,
  listWorkspaceRecipes,
} from "@/server/recipes/service";

type PricingPageProps = {
  searchParams: Promise<{
    recipeId?: string;
    runId?: string;
    saved?: string;
  }>;
};

function countEnabledModules(modules: {
  includeIngredients?: boolean;
  includeWaste?: boolean;
  includePackaging?: boolean;
  includeLabor?: boolean;
  includeEnergy?: boolean;
  includeFixedOverhead?: boolean;
  includeCommission?: boolean;
  includeTax?: boolean;
  includeTargetMargin?: boolean;
}) {
  return [
    modules.includeIngredients,
    modules.includeWaste,
    modules.includePackaging,
    modules.includeLabor,
    modules.includeEnergy,
    modules.includeFixedOverhead,
    modules.includeCommission,
    modules.includeTax,
    modules.includeTargetMargin,
  ].filter(Boolean).length;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const [query, authContext] = await Promise.all([searchParams, requireAuthenticatedContext()]);
  const recipes = await listWorkspaceRecipes(authContext.workspace.id);

  if (recipes.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Precificação</Badge>
            <CardTitle>Nenhuma receita cadastrada para cálculo</CardTitle>
            <CardDescription>
              Cadastre uma receita no workspace para começar a calcular preço, margem e custo por
              porção.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/recipes/new">
                Criar primeira receita
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/recipes">Abrir receitas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recipeIds = new Set(recipes.map((recipe) => recipe.id));
  const selectedRecipeId =
    query.recipeId && recipeIds.has(query.recipeId) ? query.recipeId : recipes[0]!.id;

  const [pricingContext, pricingRuns] = await Promise.all([
    getRecipePricingContext(authContext.workspace.id, selectedRecipeId),
    listRecipePricingRuns(authContext.workspace.id, selectedRecipeId),
  ]);

  if (!pricingContext) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receita indisponivel para precificacao</CardTitle>
          <CardDescription>
            A receita selecionada nao foi encontrada no workspace atual ou foi arquivada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/pricing">Voltar para precificacao</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0]!;
  const livePreview = calculateRecipePricing(pricingContext.input);
  const selectedRun =
    pricingRuns.find((run) => run.id === query.runId) ?? pricingRuns[0] ?? null;
  const selectedRunResult = selectedRun?.resultSnapshot ?? null;
  const selectedRunModules = selectedRun?.inputSnapshot.modules ?? null;

  return (
    <div className="space-y-6">
      {query.saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Simulacao salva com sucesso e historico atualizado em {formatDateTime(new Date())}.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit">Precificação</Badge>
              <div>
                <CardTitle className="text-2xl">Central de precificação</CardTitle>
                <CardDescription>
                  Selecione uma receita, ajuste custos adicionais e acompanhe o histórico dos
                  cálculos salvos.
                </CardDescription>
              </div>
            </div>

            <form
              method="get"
              className="flex flex-col gap-3 rounded-3xl border border-border bg-[color:var(--card-muted)] p-4 sm:flex-row sm:items-end"
            >
              <div className="min-w-[260px] space-y-2">
                <label
                  htmlFor="recipeId"
                  className="text-sm font-medium text-slate-700"
                >
                  Receita ativa
                </label>
                <select
                  id="recipeId"
                  name="recipeId"
                  defaultValue={selectedRecipeId}
                  className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/15"
                >
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">Carregar receita</Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <p className="text-sm text-slate-500">Receitas disponíveis</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{recipes.length}</p>
            <p className="mt-2 text-sm text-slate-600">Todas filtradas por workspace no servidor.</p>
          </div>
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <p className="text-sm text-slate-500">Simulacoes desta receita</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{pricingRuns.length}</p>
            <p className="mt-2 text-sm text-slate-600">
              Ultimo preco sugerido: {formatCurrency(livePreview.suggestedPrice)}
            </p>
          </div>
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <p className="text-sm text-slate-500">Receita selecionada</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{selectedRecipe.name}</p>
            <p className="mt-2 text-sm text-slate-600">
              {selectedRecipe.itemCount} itens • {formatNumber(selectedRecipe.servingsProduced, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}{" "}
              porcoes
            </p>
          </div>
        </CardContent>
      </Card>

      <PricingForm
        key={pricingContext.recipe.id}
        recipe={pricingContext.recipe}
        initialInput={pricingContext.input}
        action={savePricingRunAction}
      />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:var(--card-muted)]">
                <ReceiptText className="size-5 text-slate-900" />
              </div>
              <div>
                <CardTitle>Resultado salvo</CardTitle>
                <CardDescription>
                  Registro salvo da receita selecionada para comparação e acompanhamento.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRun && selectedRunResult && selectedRunModules ? (
              <>
                <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">Versao salva</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        Snapshot #{selectedRun.snapshotVersion}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Criado em {formatDateTime(selectedRun.createdAt)} por{" "}
                        {selectedRun.createdByName}.
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {countEnabledModules(selectedRunModules)} modulos
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-border px-4 py-4">
                    <p className="text-sm text-slate-500">Custo total salvo</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {formatCurrency(selectedRun.totalCost)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border px-4 py-4">
                    <p className="text-sm text-slate-500">Preco sugerido salvo</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {formatCurrency(selectedRun.suggestedPrice)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border px-4 py-4">
                    <p className="text-sm text-slate-500">Preco minimo</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {formatCurrency(selectedRun.breakEvenPrice)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border px-4 py-4">
                    <p className="text-sm text-slate-500">Margem alvo</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {formatPercent(selectedRun.targetMarginPercent)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    ["Ingredientes", selectedRun.ingredientCostTotal],
                    ["Custos adicionais", selectedRun.additionalCostTotal],
                    ["Custo por porcao", selectedRun.costPerServing],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm"
                    >
                      <span className="text-slate-600">{label}</span>
                      <strong className="text-slate-950">{formatCurrency(Number(value))}</strong>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  {selectedRunResult.simulations.map((simulation) => (
                    <div
                      key={simulation.marginPercent}
                      className="rounded-3xl bg-[color:var(--card-muted)] p-4"
                    >
                      <p className="text-sm text-slate-500">
                        {formatPercent(simulation.marginPercent)}%
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {formatCurrency(simulation.sellingPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-border px-5 py-6 text-sm text-slate-600">
                Nenhuma simulacao salva ainda para {selectedRecipe.name}. Ajuste os modulos acima e
                clique em salvar para registrar o primeiro snapshot.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:var(--card-muted)]">
                <History className="size-5 text-slate-900" />
              </div>
              <div>
                <CardTitle>Historico de simulacoes</CardTitle>
                <CardDescription>
                  Compare versoes salvas da mesma receita sem misturar dados de outro workspace.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pricingRuns.length > 0 ? (
              pricingRuns.map((run) => {
                const isActive = run.id === selectedRun?.id;
                const href = `/pricing?recipeId=${run.recipeId}&runId=${run.id}`;

                return (
                  <div
                    key={run.id}
                    className="rounded-3xl border border-border px-4 py-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-950">
                            Snapshot #{run.snapshotVersion}
                          </p>
                          {isActive ? <Badge>Selecionado</Badge> : null}
                        </div>
                        <p className="text-sm text-slate-600">
                          {formatDateTime(run.createdAt)} • {run.createdByName}
                        </p>
                        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                          <span>Custo {formatCurrency(run.totalCost)}</span>
                          <span>Minimo {formatCurrency(run.breakEvenPrice)}</span>
                          <span>Sugerido {formatCurrency(run.suggestedPrice)}</span>
                        </div>
                      </div>

                      <Button asChild variant={isActive ? "secondary" : "outline"}>
                        <Link href={href}>
                          Abrir snapshot
                          <LineChart className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-border px-5 py-6 text-sm text-slate-600">
                O historico aparece aqui assim que a primeira simulacao for salva.
              </div>
            )}

            <div className="rounded-3xl bg-[color:var(--card-muted)] p-5 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Clock3 className="size-4 text-slate-900" />
                Cada novo salvamento incrementa o `snapshotVersion` da receita e atualiza o perfil
                operacional padrao usado na proxima abertura.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
