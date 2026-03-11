import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package2, Tag, Wallet } from "lucide-react";

import { updateProductAction } from "@/app/(app)/products/actions";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { IngredientPriceHistory } from "@/components/ingredients/ingredient-price-history";
import { ProductPriceChart } from "@/components/products/product-price-chart";
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

type ProductDetailPageProps = {
  params: Promise<{
    productId: string;
  }>;
  searchParams: Promise<{
    saved?: string;
  }>;
};

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const [{ productId }, query, authContext] = await Promise.all([
    params,
    searchParams,
    requireAuthenticatedContext(),
  ]);

  const [product, categorySuggestions] = await Promise.all([
    getIngredientDetails(authContext.workspace.id, productId),
    listWorkspaceIngredientCategories(authContext.workspace.id),
  ]);

  if (!product) {
    notFound();
  }

  const latestPrice = product.priceHistory[0];
  const boundUpdateAction = updateProductAction.bind(null, product.id);

  return (
    <div className="space-y-6">
      {query.saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Produto atualizado com sucesso.
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Produtos
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{product.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Historico de precos, detalhes de compra e edicao concentrados em uma unica pagina.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/products">
              <ArrowLeft className="size-4" />
              Voltar para produtos
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/ingredients/${product.id}`}>Abrir visao tecnica</Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.8fr]">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Resumo do produto</Badge>
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>
              Categoria {product.category ?? "Sem categoria"} e unidade base{" "}
              {baseUnitShortLabels[product.baseUnit]}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              Marca atual: <strong className="text-slate-950">{product.brand ?? "Nao informada"}</strong>
            </p>
            <p>
              Local da compra:{" "}
              <strong className="text-slate-950">
                {product.purchaseLocation ?? "Nao informado"}
              </strong>
            </p>
            <p>
              Ultima confirmacao:{" "}
              <strong className="text-slate-950">
                {product.lastPriceConfirmedAt
                  ? formatDateTime(product.lastPriceConfirmedAt)
                  : "Ainda nao confirmada"}
              </strong>
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(209,250,229,0.65))]">
          <CardHeader>
            <Wallet className="size-5 text-emerald-700" />
            <CardTitle>Ultimo preco registrado</CardTitle>
            <CardDescription>
              Marcador principal do historico mais recente do produto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestPrice ? (
              <>
                <p className="text-3xl font-semibold text-slate-950">
                  {formatCurrency(Number(latestPrice.purchasePrice))}
                </p>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>
                    Compra: {formatNumber(Number(latestPrice.purchaseQuantity))}{" "}
                    {purchaseUnitShortLabels[latestPrice.purchaseUnit]}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <MapPin className="size-4" />
                    {latestPrice.purchaseLocation ?? "Local nao informado"}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Tag className="size-4" />
                    {latestPrice.brand ?? "Marca nao informada"}
                  </p>
                  <p>Registrado em {formatDateTime(latestPrice.effectiveDate)}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-700">Ainda nao ha preco registrado para este produto.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Package2 className="size-5 text-slate-900" />
            <CardTitle>Indicadores</CardTitle>
            <CardDescription>
              Dados prontos para comparacao de custo e reposicao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              Custo base atual:{" "}
              <strong className="text-slate-950">
                R${" "}
                {formatNumber(Number(product.unitCostInBaseUnit), {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 6,
                })}{" "}
                / {baseUnitShortLabels[product.baseUnit]}
              </strong>
            </p>
            <p>
              Historico registrado:{" "}
              <strong className="text-slate-950">{product.priceHistory.length} registros</strong>
            </p>
            <p>
              Conversao atual:{" "}
              <strong className="text-slate-950">
                {formatNumber(Number(product.conversionFactor))}{" "}
                {baseUnitShortLabels[product.baseUnit]}
              </strong>
            </p>
          </CardContent>
        </Card>
      </section>

      <ProductPriceChart
        history={product.priceHistory.map((entry) => ({
          id: entry.id,
          effectiveDate: entry.effectiveDate,
          purchasePrice: Number(entry.purchasePrice),
          purchaseLocation: entry.purchaseLocation,
        }))}
      />

      <IngredientForm
        mode="edit"
        title={`Editar ${product.name}`}
        description="Atualize categoria, marca, local da compra e dados de preco sem sair da pagina do produto."
        submitLabel="Atualizar produto"
        cancelHref="/products"
        action={boundUpdateAction}
        categorySuggestions={categorySuggestions}
        initialValues={{
          name: product.name,
          category: product.category ?? "",
          brand: product.brand ?? "",
          purchaseLocation: product.purchaseLocation ?? "",
          purchaseUnit: product.purchaseUnit,
          baseUnit: product.baseUnit,
          purchaseQuantity: product.purchaseQuantity.toString(),
          purchasePrice: product.purchasePrice.toString(),
          conversionFactor: product.conversionFactor.toString(),
          notes: product.notes ?? "",
          priceDecision: "same",
        }}
        latestPrice={
          latestPrice
            ? {
                effectiveDate: latestPrice.effectiveDate,
                brand: latestPrice.brand ?? undefined,
                purchaseLocation: latestPrice.purchaseLocation ?? undefined,
                purchaseQuantity: Number(latestPrice.purchaseQuantity),
                purchaseUnitLabel: purchaseUnitShortLabels[latestPrice.purchaseUnit],
                purchasePrice: Number(latestPrice.purchasePrice),
                conversionFactor: Number(latestPrice.conversionFactor),
                baseUnitLabel: baseUnitShortLabels[latestPrice.baseUnit],
              }
            : undefined
        }
      />

      <IngredientPriceHistory
        history={product.priceHistory.map((entry) => ({
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
