import Link from "next/link";
import { ArrowRight, ChevronRight, Package2, PencilLine } from "lucide-react";

import { requireAuthenticatedContext } from "@/lib/auth";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import {
  baseUnitShortLabels,
  purchaseUnitShortLabels,
} from "@/features/ingredients/constants";
import { listWorkspaceIngredients } from "@/server/ingredients/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function buildCategoryGroups<
  TProduct extends {
    category: string | null;
  },
>(products: TProduct[]) {
  const groups = new Map<string, TProduct[]>();

  products.forEach((product) => {
    const category = product.category ?? "Sem categoria";
    const current = groups.get(category) ?? [];

    current.push(product);
    groups.set(category, current);
  });

  return Array.from(groups.entries()).sort(([left], [right]) => {
    if (left === "Sem categoria") {
      return 1;
    }

    if (right === "Sem categoria") {
      return -1;
    }

    return left.localeCompare(right, "pt-BR");
  });
}

type ProductsPageProps = {
  searchParams: Promise<{
    deleted?: string;
    deleteError?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = await searchParams;
  const authContext = await requireAuthenticatedContext();
  const products = await listWorkspaceIngredients(authContext.workspace.id);
  const categoryGroups = buildCategoryGroups(products);
  const banner = query.deleted
    ? {
        tone: "success" as const,
        message: "Ingrediente excluido permanentemente com sucesso.",
      }
    : query.deleteError
      ? {
          tone: "error" as const,
          message: "Nao foi possivel localizar o ingrediente que voce tentou excluir.",
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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit">Produtos cadastrados</Badge>
              <div>
                <CardTitle className="text-2xl">Catalogo por categoria</CardTitle>
                <CardDescription>
                  A lista abre com as categorias recolhidas. Clique em cada categoria para ver os
                  produtos cadastrados e abrir o detalhe individual.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <Link href="/ingredients">
                  Visao completa
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild>
                <Link href="/ingredients/new">
                  <Package2 className="size-4" />
                  Novo produto
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {products.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ainda nao existem produtos cadastrados</CardTitle>
            <CardDescription>
              Cadastre seu primeiro produto para comecar a montar o catalogo da conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/ingredients/new">
                Cadastrar primeiro produto
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {categoryGroups.map(([category, categoryProducts]) => (
          <details
            key={category}
            className="group overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_20px_70px_-45px_rgba(51,65,85,0.4)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
              <div>
                <p className="text-lg font-semibold text-slate-950">{category}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {categoryProducts.length} {categoryProducts.length === 1 ? "produto" : "produtos"}
                </p>
              </div>
              <ChevronRight className="size-5 text-slate-500 transition-transform group-open:rotate-90" />
            </summary>

            <div className="border-t border-border px-4 py-4 sm:px-6">
              <div className="space-y-3">
                {categoryProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-4 rounded-3xl bg-[color:var(--card-muted)] p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="grid flex-1 gap-4 md:grid-cols-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Produto
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-950">{product.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Marca: {product.brand ?? "nao informada"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Compra atual
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-950">
                          {formatNumber(Number(product.purchaseQuantity))}{" "}
                          {purchaseUnitShortLabels[product.purchaseUnit]}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatCurrency(Number(product.purchasePrice))}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Local da compra
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-950">
                          {product.purchaseLocation ?? "Nao informado"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {product._count.priceHistory} registros
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Custo base
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-950">
                          R${" "}
                          {formatNumber(Number(product.unitCostInBaseUnit), {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 6,
                          })}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          por {baseUnitShortLabels[product.baseUnit]}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Ultima confirmacao
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-950">
                          {product.lastPriceConfirmedAt
                            ? formatDateTime(product.lastPriceConfirmedAt)
                            : "Sem confirmacao"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-3">
                      <Button asChild variant="outline">
                        <Link href={`/products/${product.id}`}>
                          <Package2 className="size-4" />
                          Abrir produto
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/ingredients/${product.id}`}>
                          <PencilLine className="size-4" />
                          Editar
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
