import { CalendarClock, MapPin, Tag } from "lucide-react";

import {
  baseUnitShortLabels,
  purchaseUnitShortLabels,
} from "@/features/ingredients/constants";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type IngredientPriceHistoryProps = {
  history: Array<{
    id: string;
    effectiveDate: Date;
    brand?: string | null;
    purchaseLocation?: string | null;
    purchaseQuantity: number;
    purchaseUnit: keyof typeof purchaseUnitShortLabels;
    purchasePrice: number;
    conversionFactor: number;
    baseUnit: keyof typeof baseUnitShortLabels;
    unitCostInBaseUnit: number;
  }>;
};

export function IngredientPriceHistory({ history }: IngredientPriceHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historico de precos</CardTitle>
        <CardDescription>
          Cada mudanca relevante fica salva para auditoria, comparacao futura e graficos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Ainda nao existe historico registrado para este ingrediente.
          </div>
        ) : null}

        {history.map((entry, index) => (
          <div
            key={entry.id}
            className={
              index === 0
                ? "rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4"
                : "rounded-2xl border border-border p-4"
            }
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <CalendarClock className="size-4" />
                {formatDateTime(entry.effectiveDate)}
              </div>
              {index === 0 ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Ultimo registro
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <p>
                Compra: {formatNumber(entry.purchaseQuantity)}{" "}
                {purchaseUnitShortLabels[entry.purchaseUnit]} por{" "}
                {formatCurrency(entry.purchasePrice)}
              </p>
              <p>
                Conversao: {formatNumber(entry.conversionFactor)}{" "}
                {baseUnitShortLabels[entry.baseUnit]} por unidade de compra
              </p>
              <p>
                Custo base: R${" "}
                {formatNumber(entry.unitCostInBaseUnit, {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 6,
                })}{" "}
                / {baseUnitShortLabels[entry.baseUnit]}
              </p>
            </div>

            {entry.purchaseLocation || entry.brand ? (
              <div className="mt-3 flex flex-col gap-2 text-sm text-slate-700 md:flex-row md:items-center md:gap-5">
                {entry.purchaseLocation ? (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-4" />
                    {entry.purchaseLocation}
                  </span>
                ) : null}
                {entry.brand ? (
                  <span className="inline-flex items-center gap-2">
                    <Tag className="size-4" />
                    {entry.brand}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
