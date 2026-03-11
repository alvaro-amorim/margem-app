"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Calculator, Package, Percent, ReceiptText, Wallet } from "lucide-react";

import { calculateRecipePricing, type PricingEngineInput } from "@/features/pricing/engine";
import {
  initialPricingActionState,
  type PricingActionState,
} from "@/features/pricing/schema";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PricingRecipeSummary = {
  id: string;
  name: string;
  description?: string | null;
  yieldQuantity: string;
  yieldUnitLabel: string;
  servingQuantity: string;
  servingUnitLabel: string;
  notes?: string | null;
};

type PricingFormProps = {
  recipe: PricingRecipeSummary;
  initialInput: PricingEngineInput;
  action: (
    state: PricingActionState,
    formData: FormData,
  ) => Promise<PricingActionState>;
};

type PricingFormValues = PricingEngineInput["modules"];
type PricingFieldKey = keyof PricingFormValues & keyof NonNullable<PricingActionState["fieldErrors"]>;

function FieldMessage({
  errors,
  field,
}: {
  errors?: PricingActionState["fieldErrors"];
  field: keyof NonNullable<PricingActionState["fieldErrors"]>;
}) {
  const message = errors?.[field]?.[0];

  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-600">{message}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Salvando simulacao..." : "Calcular e salvar simulacao"}
    </Button>
  );
}

function ModuleCheckbox({
  checked,
  name,
  onCheckedChange,
}: {
  checked: boolean | undefined;
  name: keyof PricingFormValues;
  onCheckedChange: (field: keyof PricingFormValues, value: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-3 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-900">
      <input
        type="checkbox"
        name={name}
        value="true"
        checked={checked ?? false}
        onChange={(event) => onCheckedChange(name, event.target.checked)}
        className="size-4 rounded border border-slate-300 text-slate-950 accent-slate-950"
      />
      Aplicar
    </label>
  );
}

function NumericModuleCard({
  title,
  description,
  icon,
  toggleName,
  valueName,
  checked,
  value,
  onCheckedChange,
  onValueChange,
  inputMode,
  suffix,
  prefix,
  placeholder,
  errors,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  toggleName: keyof PricingFormValues;
  valueName: PricingFieldKey;
  checked: boolean | undefined;
  value: string | number | undefined;
  onCheckedChange: (field: keyof PricingFormValues, value: boolean) => void;
  onValueChange: (field: PricingFieldKey, value: string) => void;
  inputMode: "decimal" | "numeric";
  suffix?: string;
  prefix?: string;
  placeholder: string;
  errors?: PricingActionState["fieldErrors"];
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-white p-5 transition-opacity",
        !checked && "opacity-80",
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:var(--card-muted)] text-slate-900">
              {icon}
            </div>
            <div>
              <p className="font-semibold text-slate-950">{title}</p>
              <p className="text-sm text-slate-600">{description}</p>
            </div>
          </div>
        </div>

        <ModuleCheckbox
          checked={checked}
          name={toggleName}
          onCheckedChange={onCheckedChange}
        />
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor={String(valueName)}>{checked ? "Valor aplicado" : "Valor preparado"}</Label>
        <div className="relative">
          {prefix ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm text-slate-500">
              {prefix}
            </span>
          ) : null}
          <Input
            id={String(valueName)}
            name={String(valueName)}
            inputMode={inputMode}
            value={String(value ?? "")}
            onChange={(event) => onValueChange(valueName, event.target.value)}
            placeholder={placeholder}
            className={cn(prefix && "pl-10", suffix && "pr-14")}
          />
          {suffix ? (
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-sm text-slate-500">
              {suffix}
            </span>
          ) : null}
        </div>
        <FieldMessage errors={errors} field={valueName} />
      </div>
    </div>
  );
}

export function PricingForm({ recipe, initialInput, action }: PricingFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialPricingActionState);
  const [values, setValues] = useState<PricingFormValues>(initialInput.modules);

  useEffect(() => {
    if (!state.redirectTo) {
      return;
    }

    startTransition(() => {
      router.replace(state.redirectTo!);
    });
  }, [router, state.redirectTo]);

  function updateBoolean(field: keyof PricingFormValues, value: boolean) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateText(field: PricingFieldKey, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  let previewError: string | null = null;
  let preview = null as ReturnType<typeof calculateRecipePricing> | null;

  try {
    preview = calculateRecipePricing({
      ...initialInput,
      modules: values,
    });
  } catch (error) {
    previewError = error instanceof Error ? error.message : "Nao foi possivel calcular a previa.";
  }

  const ingredientRows = initialInput.items.map((item) => {
    const quantity = Number(item.quantityInBaseUnit);
    const unitCost = Number(item.unitCostInBaseUnit);

    return {
      ...item,
      quantity,
      unitCost,
      total: quantity * unitCost,
    };
  });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="recipeId" value={recipe.id} />

      {state.message ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm",
            state.status === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {state.message}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Receita selecionada</Badge>
            <CardTitle>{recipe.name}</CardTitle>
            <CardDescription>
              {recipe.description ?? "Sem descricao curta cadastrada para esta receita."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
              <p className="text-sm text-slate-500">Rendimento total</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {formatNumber(Number(recipe.yieldQuantity))} {recipe.yieldUnitLabel}
              </p>
            </div>
            <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
              <p className="text-sm text-slate-500">Porcao vendida</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {formatNumber(Number(recipe.servingQuantity))} {recipe.servingUnitLabel}
              </p>
            </div>
            <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
              <p className="text-sm text-slate-500">Ingredientes carregados</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{ingredientRows.length}</p>
            </div>
            <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
              <p className="text-sm text-slate-500">Anotacoes internas</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {recipe.notes ?? "Sem observacoes adicionais."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:var(--card-muted)]">
                <Calculator className="size-5 text-slate-900" />
              </div>
              <div>
                <CardTitle>Resumo de calculo</CardTitle>
                <CardDescription>
                  Os ingredientes vem do servidor e os ajustes ficam concentrados nesta tela.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {previewError}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
                <p className="text-sm text-slate-500">Custo total</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {preview ? formatCurrency(preview.breakdown.totalCost) : "--"}
                </p>
              </div>
              <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
                <p className="text-sm text-slate-500">Preco sugerido</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {preview ? formatCurrency(preview.suggestedPrice) : "--"}
                </p>
              </div>
              <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
                <p className="text-sm text-slate-500">Preco minimo</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {preview ? formatCurrency(preview.breakEvenPrice) : "--"}
                </p>
              </div>
              <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
                <p className="text-sm text-slate-500">Porcoes produzidas</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {preview
                    ? formatNumber(preview.servingsProduced, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })
                    : "--"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4 rounded-[2rem] border border-border bg-card p-6 shadow-[0_20px_70px_-45px_rgba(51,65,85,0.4)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Modulos de custo
          </p>
          <h2 className="text-2xl font-semibold text-slate-950">Ajustes da simulacao</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Cada simulacao salva atualiza o perfil operacional da receita e grava um snapshot em
            `PricingRun` para historico e consulta posterior.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:var(--card-muted)] text-slate-900">
                  <Package className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">Ingredientes</p>
                  <p className="text-sm text-slate-600">
                    Permite considerar ou desconsiderar o custo base dos itens da receita.
                  </p>
                </div>
              </div>
            </div>

            <ModuleCheckbox
              checked={values.includeIngredients}
              name="includeIngredients"
              onCheckedChange={updateBoolean}
            />
          </div>
          <FieldMessage errors={state.fieldErrors} field="includeIngredients" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <NumericModuleCard
            title="Perda e quebra"
            description="Aplica percentual sobre o custo efetivo dos ingredientes."
            icon={<Percent className="size-5" />}
            toggleName="includeWaste"
            valueName="wastePercent"
            checked={values.includeWaste}
            value={values.wastePercent}
            onCheckedChange={updateBoolean}
            onValueChange={updateText}
            inputMode="decimal"
            suffix="%"
            placeholder="Ex.: 5"
            errors={state.fieldErrors}
          />

          <NumericModuleCard
            title="Embalagem"
            description="Valor fixo somado ao lote produzido."
            icon={<Package className="size-5" />}
            toggleName="includePackaging"
            valueName="packagingCost"
            checked={values.includePackaging}
            value={values.packagingCost}
            onCheckedChange={updateBoolean}
            onValueChange={updateText}
            inputMode="decimal"
            prefix="R$"
            placeholder="Ex.: 2,50"
            errors={state.fieldErrors}
          />

          <NumericModuleCard
            title="Mao de obra"
            description="Horas e esforco operacional convertidos em valor do lote."
            icon={<Wallet className="size-5" />}
            toggleName="includeLabor"
            valueName="laborCost"
            checked={values.includeLabor}
            value={values.laborCost}
            onCheckedChange={updateBoolean}
            onValueChange={updateText}
            inputMode="decimal"
            prefix="R$"
            placeholder="Ex.: 8,00"
            errors={state.fieldErrors}
          />

          <NumericModuleCard
            title="Gas e energia"
            description="Consumo estimado de preparo e finalizacao."
            icon={<ReceiptText className="size-5" />}
            toggleName="includeEnergy"
            valueName="energyCost"
            checked={values.includeEnergy}
            value={values.energyCost}
            onCheckedChange={updateBoolean}
            onValueChange={updateText}
            inputMode="decimal"
            prefix="R$"
            placeholder="Ex.: 1,80"
            errors={state.fieldErrors}
          />

          <NumericModuleCard
            title="Custo fixo rateado"
            description="Aluguel, limpeza, administracao e outros custos indiretos."
            icon={<Wallet className="size-5" />}
            toggleName="includeFixedOverhead"
            valueName="fixedOverheadCost"
            checked={values.includeFixedOverhead}
            value={values.fixedOverheadCost}
            onCheckedChange={updateBoolean}
            onValueChange={updateText}
            inputMode="decimal"
            prefix="R$"
            placeholder="Ex.: 3,40"
            errors={state.fieldErrors}
          />

          <NumericModuleCard
            title="Comissao"
            description="Percentual sobre o subtotal antes de impostos."
            icon={<Percent className="size-5" />}
            toggleName="includeCommission"
            valueName="commissionPercent"
            checked={values.includeCommission}
            value={values.commissionPercent}
            onCheckedChange={updateBoolean}
            onValueChange={updateText}
            inputMode="decimal"
            suffix="%"
            placeholder="Ex.: 5"
            errors={state.fieldErrors}
          />

          <NumericModuleCard
            title="Impostos"
            description="Percentual aplicado depois do subtotal e da comissao."
            icon={<Percent className="size-5" />}
            toggleName="includeTax"
            valueName="taxPercent"
            checked={values.includeTax}
            value={values.taxPercent}
            onCheckedChange={updateBoolean}
            onValueChange={updateText}
            inputMode="decimal"
            suffix="%"
            placeholder="Ex.: 6"
            errors={state.fieldErrors}
          />

          <NumericModuleCard
            title="Margem alvo"
            description="Usada para gerar o preco sugerido por porcao."
            icon={<Calculator className="size-5" />}
            toggleName="includeTargetMargin"
            valueName="targetMarginPercent"
            checked={values.includeTargetMargin}
            value={values.targetMarginPercent}
            onCheckedChange={updateBoolean}
            onValueChange={updateText}
            inputMode="decimal"
            suffix="%"
            placeholder="Ex.: 30"
            errors={state.fieldErrors}
          />
        </div>

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Breakdown atual</CardTitle>
            <CardDescription>
              Composicao calculada com os modulos atuais antes de salvar o resultado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview ? (
              [
                ["Ingredientes efetivos", preview.breakdown.effectiveIngredientCost],
                ["Perda", preview.breakdown.wasteCost],
                ["Embalagem", preview.breakdown.packagingCost],
                ["Mao de obra", preview.breakdown.laborCost],
                ["Gas e energia", preview.breakdown.energyCost],
                ["Custo fixo", preview.breakdown.fixedOverheadCost],
                ["Comissao", preview.breakdown.commissionCost],
                ["Impostos", preview.breakdown.taxCost],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm"
                >
                  <span className="text-slate-600">{label}</span>
                  <strong className="text-slate-950">
                    {formatCurrency(Number(value))}
                  </strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                Corrija os campos acima para restaurar a previa da simulacao.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens considerados</CardTitle>
            <CardDescription>
              Os ingredientes continuam sendo lidos do servidor e filtrados pelo workspace atual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ingredientRows.map((item) => (
              <div
                key={item.ingredientId}
                className="rounded-2xl border border-border px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{item.ingredientName}</p>
                    <p className="text-sm text-slate-600">
                      {formatNumber(item.quantity, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 3,
                      })}{" "}
                      unidade base
                    </p>
                  </div>
                  <Badge variant="secondary">{formatCurrency(item.total)}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Custo unitario atual: R${" "}
                  {formatNumber(item.unitCost, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 6,
                  })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Simulacao de margens</CardTitle>
          <CardDescription>
            Faixas derivadas do custo por porcao com base no calculo atual.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          {preview ? (
            preview.simulations.map((simulation) => (
              <div
                key={simulation.marginPercent}
                className="rounded-3xl border border-border bg-[color:var(--card-muted)] p-4"
              >
                <p className="text-sm text-slate-500">
                  Margem {formatPercent(simulation.marginPercent)}%
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatCurrency(simulation.sellingPrice)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Lucro {formatCurrency(simulation.profitPerServing)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">
              O resumo volta a aparecer assim que os campos estiverem validos.
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
