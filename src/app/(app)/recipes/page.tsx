import Link from "next/link";
import { ArrowRight, CookingPot, PackageCheck, Settings2 } from "lucide-react";

import { requireAuthenticatedContext } from "@/lib/auth";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import {
  listRecipeIngredientOptions,
  listWorkspaceRecipes,
} from "@/server/recipes/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RecipesPage() {
  const authContext = await requireAuthenticatedContext();
  const [recipes, ingredients] = await Promise.all([
    listWorkspaceRecipes(authContext.workspace.id),
    listRecipeIngredientOptions(authContext.workspace.id),
  ]);

  const totalRecipeItems = recipes.reduce((accumulator, recipe) => accumulator + recipe.itemCount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit">Receitas</Badge>
              <div>
                <CardTitle className="text-2xl">Receitas do workspace</CardTitle>
                <CardDescription>
                  Organize rendimento, porção vendida e itens normalizados para manter a ficha
                  técnica de cada receita sempre atualizada.
                </CardDescription>
              </div>
            </div>
            {ingredients.length > 0 ? (
              <Button asChild size="lg">
                <Link href="/recipes/new">
                  Nova receita
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline">
                <Link href="/ingredients/new">
                  Primeiro ingrediente
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <p className="text-sm text-slate-500">Receitas ativas</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{recipes.length}</p>
            <p className="mt-2 text-sm text-slate-600">Isoladas por workspace no servidor.</p>
          </div>
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <PackageCheck className="size-5 text-slate-900" />
            <p className="mt-3 font-medium text-slate-900">Itens vinculados</p>
            <p className="mt-1 text-sm text-slate-600">
              {totalRecipeItems} itens ligados a ingredientes reutilizáveis.
            </p>
          </div>
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <Settings2 className="size-5 text-slate-900" />
            <p className="mt-3 font-medium text-slate-900">Perfil de precificação</p>
            <p className="mt-1 text-sm text-slate-600">
              Cada receita mantém parâmetros próprios para cálculo e margem.
            </p>
          </div>
        </CardContent>
      </Card>

      {ingredients.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Cadastre ingredientes antes de criar receitas</CardTitle>
            <CardDescription>
              Como os itens da receita dependem de ingredientes existentes, esse é o próximo passo
              obrigatório do fluxo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/ingredients/new">
                Cadastrar primeiro ingrediente
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {recipes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Seu workspace ainda não tem receitas</CardTitle>
            <CardDescription>
              Monte a primeira receita usando os ingredientes já cadastrados para preparar a próxima
              etapa de cálculo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/recipes/new">
                Criar primeira receita
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {recipes.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{recipe.name}</CardTitle>
                  <CardDescription>
                    {recipe.description ?? "Sem descrição"} • atualizado em{" "}
                    {formatDateTime(recipe.updatedAt)}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{recipe.itemCount} itens</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
                  <p className="text-sm text-slate-500">Rendimento</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatNumber(Number(recipe.yieldQuantity))} {recipe.yieldUnitLabel}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Porção: {formatNumber(Number(recipe.servingQuantity))} {recipe.servingUnitLabel}
                  </p>
                </div>
                <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
                  <p className="text-sm text-slate-500">Porções produzidas</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatNumber(recipe.servingsProduced, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Base para cálculo da engine</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
                  <p className="text-sm text-slate-500">Custo base</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCurrency(recipe.ingredientCostTotal)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Soma atual dos ingredientes</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CookingPot className="size-4" />
                  Dados filtrados pelo workspace {authContext.workspace.name}.
                </div>
                <Button asChild variant="outline">
                  <Link href={`/recipes/${recipe.id}`}>
                    Abrir detalhe
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
