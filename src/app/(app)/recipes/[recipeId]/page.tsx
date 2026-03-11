import Link from "next/link";
import { notFound } from "next/navigation";
import { CookingPot, Layers3, Wallet } from "lucide-react";

import { deleteRecipeAction, updateRecipeAction } from "@/app/(app)/recipes/actions";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { baseUnitShortLabels } from "@/features/ingredients/constants";
import { calculateRecipePricing } from "@/features/pricing/engine";
import { requireAuthenticatedContext } from "@/lib/auth";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import {
  getRecipeDetails,
  getRecipePricingContext,
  listRecipeIngredientOptions,
} from "@/server/recipes/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RecipeDetailPageProps = {
  params: Promise<{
    recipeId: string;
  }>;
  searchParams: Promise<{
    created?: string;
    saved?: string;
  }>;
};

export default async function RecipeDetailPage({
  params,
  searchParams,
}: RecipeDetailPageProps) {
  const [{ recipeId }, query, authContext] = await Promise.all([
    params,
    searchParams,
    requireAuthenticatedContext(),
  ]);

  const [recipe, ingredients, pricingContext] = await Promise.all([
    getRecipeDetails(authContext.workspace.id, recipeId),
    listRecipeIngredientOptions(authContext.workspace.id),
    getRecipePricingContext(authContext.workspace.id, recipeId),
  ]);

  if (!recipe || !pricingContext) {
    notFound();
  }

  const pricingPreview = calculateRecipePricing(pricingContext.input);
  const ingredientCostTotal = recipe.items.reduce((accumulator, item) => {
    return (
      accumulator +
      Number(item.quantityInBaseUnit.toString()) * Number(item.ingredient.unitCostInBaseUnit.toString())
    );
  }, 0);
  const boundUpdateAction = updateRecipeAction.bind(null, recipe.id);
  const boundDeleteAction = deleteRecipeAction.bind(null, recipe.id);
  const bannerMessage = query.created
    ? "Receita criada com sucesso."
    : query.saved
      ? "Receita atualizada com sucesso."
      : null;

  return (
    <div className="space-y-6">
      {bannerMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {bannerMessage}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Receita ativa</Badge>
            <CardTitle>{recipe.name}</CardTitle>
            <CardDescription>
              Atualizada em {formatDateTime(recipe.updatedAt)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              Rendimento:{" "}
              <strong className="text-slate-950">
                {formatNumber(Number(recipe.yieldQuantity))} {recipe.yieldUnitLabel}
              </strong>
            </p>
            <p>
              Porção vendida:{" "}
              <strong className="text-slate-950">
                {formatNumber(Number(recipe.servingQuantity))} {recipe.servingUnitLabel}
              </strong>
            </p>
            <p>{recipe.description ?? "Sem descrição adicional."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Wallet className="size-5 text-slate-900" />
            <CardTitle>Prévia da engine</CardTitle>
            <CardDescription>
              A receita já carrega os itens no formato usado pelo motor de precificação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              Custo base dos ingredientes:{" "}
              <strong className="text-slate-950">{formatCurrency(ingredientCostTotal)}</strong>
            </p>
            <p>
              Custo por porção:{" "}
              <strong className="text-slate-950">
                {formatCurrency(pricingPreview.breakEvenPrice)}
              </strong>
            </p>
            <p>
              Preço sugerido atual:{" "}
              <strong className="text-slate-950">
                {formatCurrency(pricingPreview.suggestedPrice)}
              </strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Layers3 className="size-5 text-slate-900" />
            <CardTitle>Composição</CardTitle>
            <CardDescription>
              Itens vinculados ao workspace atual, com quantidade na unidade base.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              Ingredientes na receita:{" "}
              <strong className="text-slate-950">{recipe.items.length}</strong>
            </p>
            <p>
              Porções produzidas:{" "}
              <strong className="text-slate-950">
                {formatNumber(pricingPreview.servingsProduced, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </p>
            <Button asChild variant="outline" className="w-full justify-center">
              <Link href="/recipes">Voltar para a lista</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <RecipeForm
        mode="edit"
        title={`Editar ${recipe.name}`}
        description="Revise a estrutura da receita, ajuste os itens e mantenha a ficha técnica alinhada ao custo atual."
        submitLabel="Atualizar receita"
        cancelHref="/recipes"
        action={boundUpdateAction}
        deleteAction={boundDeleteAction}
        availableIngredients={ingredients.map((ingredient) => ({
          ...ingredient,
          unitCostInBaseUnit: Number(ingredient.unitCostInBaseUnit),
        }))}
        initialValues={{
          name: recipe.name,
          description: recipe.description ?? "",
          yieldQuantity: recipe.yieldQuantity.toString(),
          yieldUnitLabel: recipe.yieldUnitLabel,
          servingQuantity: recipe.servingQuantity.toString(),
          servingUnitLabel: recipe.servingUnitLabel,
          notes: recipe.notes ?? "",
          items: recipe.items.map((item) => ({
            id: item.id,
            ingredientId: item.ingredientId,
            quantityInBaseUnit: item.quantityInBaseUnit.toString(),
            notes: item.notes ?? "",
          })),
        }}
      />

      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            Itens atuais
          </Badge>
          <CardTitle>Resumo dos ingredientes</CardTitle>
          <CardDescription>
            Estrutura já normalizada para alimentar cálculo, histórico e exportação.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {recipe.items.map((item) => (
            <div key={item.id} className="rounded-3xl bg-[color:var(--card-muted)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{item.ingredient.name}</p>
                  <p className="text-sm text-slate-600">
                    {item.ingredient.category ?? "Sem categoria"}
                  </p>
                </div>
                <Badge variant="outline">
                  {baseUnitShortLabels[item.ingredient.baseUnit]}
                </Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p>
                  Quantidade:{" "}
                  <strong className="text-slate-950">
                    {formatNumber(Number(item.quantityInBaseUnit))}{" "}
                    {baseUnitShortLabels[item.ingredient.baseUnit]}
                  </strong>
                </p>
                <p>
                  Custo base:{" "}
                  <strong className="text-slate-950">
                    {formatCurrency(
                      Number(item.quantityInBaseUnit) * Number(item.ingredient.unitCostInBaseUnit),
                    )}
                  </strong>
                </p>
                <p>{item.notes ?? "Sem observações específicas para este item."}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CookingPot className="size-5 text-slate-900" />
          <CardTitle>Base de cálculo</CardTitle>
          <CardDescription>
            A receita é carregada do servidor com os dados necessários para cálculo e histórico.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <p className="text-sm text-slate-500">Itens carregados</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {pricingContext.input.items.length}
            </p>
          </div>
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <p className="text-sm text-slate-500">Módulos aplicados</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {[
                pricingContext.input.modules.includeWaste,
                pricingContext.input.modules.includePackaging,
                pricingContext.input.modules.includeLabor,
                pricingContext.input.modules.includeEnergy,
                pricingContext.input.modules.includeFixedOverhead,
                pricingContext.input.modules.includeCommission,
                pricingContext.input.modules.includeTax,
                pricingContext.input.modules.includeTargetMargin,
              ].filter(Boolean).length}
            </p>
          </div>
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <p className="text-sm text-slate-500">Uso</p>
            <p className="mt-2 text-sm font-medium text-slate-950">
              Use esta estrutura na central de precificação para gerar novos cálculos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
