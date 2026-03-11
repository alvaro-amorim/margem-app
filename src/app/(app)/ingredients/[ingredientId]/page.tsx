import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteIngredientAction,
  updateIngredientAction,
} from "@/app/(app)/ingredients/actions";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { IngredientPriceHistory } from "@/components/ingredients/ingredient-price-history";
import {
  baseUnitShortLabels,
  purchaseUnitShortLabels,
} from "@/features/ingredients/constants";
import { requireAuthenticatedContext } from "@/lib/auth";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import {
  getIngredientDetails,
  listWorkspaceIngredientCategories,
} from "@/server/ingredients/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type IngredientDetailPageProps = {
  params: Promise<{
    ingredientId: string;
  }>;
  searchParams: Promise<{
    created?: string;
    saved?: string;
    deleteError?: string;
  }>;
};

export default async function IngredientDetailPage({
  params,
  searchParams,
}: IngredientDetailPageProps) {
  const [{ ingredientId }, query, authContext] = await Promise.all([
    params,
    searchParams,
    requireAuthenticatedContext(),
  ]);

  const [ingredient, categorySuggestions] = await Promise.all([
    getIngredientDetails(authContext.workspace.id, ingredientId),
    listWorkspaceIngredientCategories(authContext.workspace.id),
  ]);

  if (!ingredient) {
    notFound();
  }

  const boundUpdateAction = updateIngredientAction.bind(null, ingredient.id);
  const boundDeleteAction = deleteIngredientAction.bind(null, ingredient.id);
  const banner = query.deleteError
    ? {
        tone: "error" as const,
        message:
          query.deleteError === "recipe-in-use"
            ? "Esse ingrediente nao pode ser excluido porque esta vinculado a uma ou mais receitas."
            : "Nao foi possivel concluir a exclusao do ingrediente.",
      }
    : query.created
      ? {
          tone: "success" as const,
          message: "Ingrediente criado com sucesso.",
        }
      : query.saved
        ? {
            tone: "success" as const,
            message: "Ingrediente atualizado com sucesso.",
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

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Ingrediente ativo</Badge>
            <CardTitle>{ingredient.name}</CardTitle>
            <CardDescription>
              Ultima confirmacao de preco:{" "}
              {ingredient.lastPriceConfirmedAt
                ? formatDateTime(ingredient.lastPriceConfirmedAt)
                : "ainda nao confirmada"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
              <p className="text-sm text-slate-500">Compra atual</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {formatNumber(Number(ingredient.purchaseQuantity))}{" "}
                {purchaseUnitShortLabels[ingredient.purchaseUnit]}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                por {formatCurrency(Number(ingredient.purchasePrice))}
              </p>
            </div>
            <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
              <p className="text-sm text-slate-500">Categoria</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {ingredient.category ?? "Sem categoria"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Marca: {ingredient.brand ?? "nao informada"}
              </p>
            </div>
            <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
              <p className="text-sm text-slate-500">Local da compra</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {ingredient.purchaseLocation ?? "Nao informado"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Conversao: {formatNumber(Number(ingredient.conversionFactor))}{" "}
                {baseUnitShortLabels[ingredient.baseUnit]}
              </p>
            </div>
            <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
              <p className="text-sm text-slate-500">Custo base</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                R${" "}
                {formatNumber(Number(ingredient.unitCostInBaseUnit), {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 6,
                })}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                por {baseUnitShortLabels[ingredient.baseUnit]}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operacao</CardTitle>
            <CardDescription>
              Edite os dados do produto e mantenha o historico de compras consistente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>O produto segue isolado pelo workspace atual.</p>
            <p>Alteracoes de compra geram nova linha em historico.</p>
            <p>Voce tambem pode abrir a visao dedicada em produtos.</p>
            <Button asChild variant="outline" className="w-full justify-center">
              <Link href={`/products/${ingredient.id}`}>Abrir pagina do produto</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <IngredientForm
        mode="edit"
        title={`Editar ${ingredient.name}`}
        description="Revise os dados cadastrais, categoria, marca e local da compra, e use a confirmacao de preco para manter o historico consistente."
        submitLabel="Atualizar ingrediente"
        cancelHref="/ingredients"
        action={boundUpdateAction}
        deleteAction={boundDeleteAction}
        deleteLabel="Excluir ingrediente"
        deleteConfirmMessage="Quer mesmo excluir esse ingrediente? Todo o historico dele sera removido permanentemente."
        categorySuggestions={categorySuggestions}
        initialValues={{
          name: ingredient.name,
          category: ingredient.category ?? "",
          brand: ingredient.brand ?? "",
          purchaseLocation: ingredient.purchaseLocation ?? "",
          purchaseUnit: ingredient.purchaseUnit,
          baseUnit: ingredient.baseUnit,
          purchaseQuantity: ingredient.purchaseQuantity.toString(),
          purchasePrice: ingredient.purchasePrice.toString(),
          conversionFactor: ingredient.conversionFactor.toString(),
          notes: ingredient.notes ?? "",
          priceDecision: "same",
        }}
        latestPrice={
          ingredient.priceHistory[0]
            ? {
                effectiveDate: ingredient.priceHistory[0].effectiveDate,
                brand: ingredient.priceHistory[0].brand ?? undefined,
                purchaseLocation: ingredient.priceHistory[0].purchaseLocation ?? undefined,
                purchaseQuantity: Number(ingredient.priceHistory[0].purchaseQuantity),
                purchaseUnitLabel: purchaseUnitShortLabels[ingredient.priceHistory[0].purchaseUnit],
                purchasePrice: Number(ingredient.priceHistory[0].purchasePrice),
                conversionFactor: Number(ingredient.priceHistory[0].conversionFactor),
                baseUnitLabel: baseUnitShortLabels[ingredient.priceHistory[0].baseUnit],
              }
            : undefined
        }
      />

      <IngredientPriceHistory
        history={ingredient.priceHistory.map((entry) => ({
          id: entry.id,
          effectiveDate: entry.effectiveDate,
          brand: entry.brand,
          purchaseLocation: entry.purchaseLocation,
          purchaseQuantity: Number(entry.purchaseQuantity),
          purchaseUnit: entry.purchaseUnit,
          purchasePrice: Number(entry.purchasePrice),
          conversionFactor: Number(entry.conversionFactor),
          baseUnit: entry.baseUnit,
          unitCostInBaseUnit: Number(entry.unitCostInBaseUnit),
        }))}
      />
    </div>
  );
}
