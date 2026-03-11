import Link from "next/link";
import { ArrowRight, PackagePlus, ReceiptText, Scale } from "lucide-react";

import {
  baseUnitShortLabels,
  purchaseUnitShortLabels,
} from "@/features/ingredients/constants";
import { requireAuthenticatedContext } from "@/lib/auth";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { listWorkspaceIngredients } from "@/server/ingredients/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function IngredientsPage() {
  const authContext = await requireAuthenticatedContext();
  const ingredients = await listWorkspaceIngredients(authContext.workspace.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit">Ingredientes</Badge>
              <div>
                <CardTitle className="text-2xl">Base de ingredientes do workspace</CardTitle>
                <CardDescription>
                  Cadastro reutilizável com custo base, conversão consistente e histórico de preço
                  para sustentar receitas e precificação.
                </CardDescription>
              </div>
            </div>
            <Button asChild size="lg">
              <Link href="/ingredients/new">
                <PackagePlus className="size-4" />
                Novo ingrediente
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <p className="text-sm text-slate-500">Ingredientes ativos</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{ingredients.length}</p>
            <p className="mt-2 text-sm text-slate-600">
              Ligados ao workspace {authContext.workspace.name}.
            </p>
          </div>
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <Scale className="size-5 text-slate-900" />
            <p className="mt-3 font-medium text-slate-900">Conversão estruturada</p>
            <p className="mt-1 text-sm text-slate-600">
              Compra e uso separados com fator de conversão auditável.
            </p>
          </div>
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <ReceiptText className="size-5 text-slate-900" />
            <p className="mt-3 font-medium text-slate-900">Histórico confiável</p>
            <p className="mt-1 text-sm text-slate-600">
              Cada atualização relevante fica registrada para comparação.
            </p>
          </div>
        </CardContent>
      </Card>

      {ingredients.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Seu workspace ainda não tem ingredientes</CardTitle>
            <CardDescription>
              Cadastre os primeiros itens para começar a montar receitas e calcular preços.
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

      <div className="grid gap-4 xl:grid-cols-2">
        {ingredients.map((ingredient) => (
          <Card key={ingredient.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{ingredient.name}</CardTitle>
                  <CardDescription>
                    {ingredient.category ?? "Sem categoria"} • custo base por{" "}
                    {baseUnitShortLabels[ingredient.baseUnit]}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{ingredient._count.priceHistory} registros</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
                  <p className="text-sm text-slate-500">Compra atual</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatNumber(Number(ingredient.purchaseQuantity))}{" "}
                    {purchaseUnitShortLabels[ingredient.purchaseUnit]}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatCurrency(Number(ingredient.purchasePrice))}
                  </p>
                </div>
                <div className="rounded-2xl bg-[color:var(--card-muted)] p-4">
                  <p className="text-sm text-slate-500">Conversão</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatNumber(Number(ingredient.conversionFactor))}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {baseUnitShortLabels[ingredient.baseUnit]} por unidade de compra
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
              </div>

              <div className="flex flex-col gap-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                <p>
                  Última confirmação:{" "}
                  {ingredient.lastPriceConfirmedAt
                    ? formatDateTime(ingredient.lastPriceConfirmedAt)
                    : "não confirmada"}
                </p>
                <Button asChild variant="outline">
                  <Link href={`/ingredients/${ingredient.id}`}>
                    Abrir detalhe
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Padrões do catálogo</CardTitle>
          <CardDescription>
            O cadastro foi estruturado para manter custos e conversões consistentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <Scale className="size-5 text-slate-900" />
            <p className="mt-3 font-medium text-slate-900">Conversão consistente</p>
            <p className="mt-1 text-sm text-slate-600">
              Compra em kg/l/dúzia/embalagem e uso em g/ml/unidade.
            </p>
          </div>
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <ReceiptText className="size-5 text-slate-900" />
            <p className="mt-3 font-medium text-slate-900">Histórico versionado</p>
            <p className="mt-1 text-sm text-slate-600">
              Cada atualização relevante gera uma linha em `IngredientPriceHistory`.
            </p>
          </div>
          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <PackagePlus className="size-5 text-slate-900" />
            <p className="mt-3 font-medium text-slate-900">Pergunta de preço</p>
            <p className="mt-1 text-sm text-slate-600">
              O fluxo reaproveita o último preço e pede confirmação antes de alterar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
