import { LineChart } from "lucide-react";

import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ProductPriceChartProps = {
  history: Array<{
    id: string;
    effectiveDate: Date;
    purchasePrice: number;
    purchaseLocation?: string | null;
  }>;
};

const CHART_WIDTH = 720;
const CHART_HEIGHT = 280;
const PADDING_X = 44;
const PADDING_Y = 28;

function clampValue(value: number, min: number, max: number) {
  if (max === min) {
    return CHART_HEIGHT / 2;
  }

  const usableHeight = CHART_HEIGHT - PADDING_Y * 2;
  const ratio = (value - min) / (max - min);
  return CHART_HEIGHT - PADDING_Y - ratio * usableHeight;
}

export function ProductPriceChart({ history }: ProductPriceChartProps) {
  const orderedHistory = [...history].sort(
    (left, right) => left.effectiveDate.getTime() - right.effectiveDate.getTime(),
  );

  if (orderedHistory.length < 2) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <LineChart className="size-5 text-slate-900" />
            <div>
              <CardTitle>Evolucao de preco</CardTitle>
              <CardDescription>
                Grafico de preco do produto com base no historico cadastrado.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-3xl border border-dashed border-border bg-[color:var(--card-muted)] p-6 text-sm text-slate-600">
            Produto apenas com um registro. O grafico sera mostrado a partir da segunda base de
            preco.
          </div>
        </CardContent>
      </Card>
    );
  }

  const values = orderedHistory.map((entry) => entry.purchasePrice);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const adjustedMin = minValue === maxValue ? minValue * 0.9 : minValue;
  const adjustedMax = minValue === maxValue ? maxValue * 1.1 : maxValue;
  const stepX =
    orderedHistory.length > 1
      ? (CHART_WIDTH - PADDING_X * 2) / (orderedHistory.length - 1)
      : 0;
  const points = orderedHistory.map((entry, index) => {
    const x = PADDING_X + stepX * index;
    const y = clampValue(entry.purchasePrice, adjustedMin, adjustedMax);

    return {
      ...entry,
      x,
      y,
    };
  });
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <LineChart className="size-5 text-slate-900" />
          <div>
            <CardTitle>Evolucao de preco</CardTitle>
            <CardDescription>
              Variacao do preco de compra registrada para este produto.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto rounded-3xl border border-border bg-white p-4">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="h-[280px] min-w-[720px] w-full"
            role="img"
            aria-label="Grafico de evolucao de preco"
          >
            {[0, 1, 2, 3].map((step) => {
              const y = PADDING_Y + ((CHART_HEIGHT - PADDING_Y * 2) / 3) * step;

              return (
                <line
                  key={step}
                  x1={PADDING_X}
                  y1={y}
                  x2={CHART_WIDTH - PADDING_X}
                  y2={y}
                  stroke="rgba(148,163,184,0.25)"
                  strokeDasharray="4 6"
                />
              );
            })}

            <polyline
              fill="none"
              stroke="rgb(15,23,42)"
              strokeWidth="4"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={pointString}
            />

            {points.map((point, index) => {
              const isLatest = index === points.length - 1;

              return (
                <g key={point.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isLatest ? 8 : 6}
                    fill={isLatest ? "rgb(16,185,129)" : "rgb(15,23,42)"}
                  />
                  <text
                    x={point.x}
                    y={point.y - 14}
                    textAnchor="middle"
                    fontSize="12"
                    fill="rgb(71,85,105)"
                  >
                    {formatCurrency(point.purchasePrice)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {orderedHistory.map((entry) => (
            <div key={entry.id} className="rounded-2xl bg-[color:var(--card-muted)] p-4 text-sm">
              <p className="font-semibold text-slate-950">{formatCurrency(entry.purchasePrice)}</p>
              <p className="mt-1 text-slate-600">{formatDateTime(entry.effectiveDate)}</p>
              <p className="mt-1 text-slate-600">{entry.purchaseLocation ?? "Local nao informado"}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
