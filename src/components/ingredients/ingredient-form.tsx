"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Info, Trash2 } from "lucide-react";

import {
  baseUnitOptions,
  baseUnitShortLabels,
  getSuggestedConversionFactorValue,
  ingredientPriceDecisionOptions,
  purchaseUnitOptions,
  purchaseUnitShortLabels,
} from "@/features/ingredients/constants";
import {
  initialIngredientActionState,
  type IngredientActionState,
  type IngredientPriceDecision,
} from "@/features/ingredients/schema";
import { cn, formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type IngredientFormValues = {
  name: string;
  category: string;
  brand: string;
  purchaseLocation: string;
  purchaseUnit: (typeof purchaseUnitOptions)[number]["value"];
  baseUnit: (typeof baseUnitOptions)[number]["value"];
  purchaseQuantity: string;
  purchasePrice: string;
  conversionFactor: string;
  notes: string;
  priceDecision: IngredientPriceDecision;
};

type PriceSnapshotSummary = {
  effectiveDate: Date | string;
  brand?: string;
  purchaseLocation?: string;
  purchaseQuantity: number;
  purchaseUnitLabel: string;
  purchasePrice: number;
  conversionFactor: number;
  baseUnitLabel: string;
};

type IngredientFormProps = {
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  cancelHref: string;
  action: (
    state: IngredientActionState,
    formData: FormData,
  ) => Promise<IngredientActionState>;
  initialValues: IngredientFormValues;
  latestPrice?: PriceSnapshotSummary;
  categorySuggestions?: string[];
  deleteAction?: () => Promise<{
    redirectTo: string;
  }>;
  deleteLabel?: string;
  deleteConfirmMessage?: string;
};

function normalizeCategoryKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

function FieldMessage({
  errors,
  field,
}: {
  errors?: IngredientActionState["fieldErrors"];
  field: keyof NonNullable<IngredientActionState["fieldErrors"]>;
}) {
  const message = errors?.[field]?.[0];

  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-600">{message}</p>;
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function DeleteIngredientButton({
  action,
  confirmMessage,
  label,
}: {
  action: () => Promise<{
    redirectTo: string;
  }>;
  confirmMessage: string;
  label: string;
}) {
  const router = useRouter();
  const [isPending, startDeleteTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteStartedRef = useRef(false);

  function handleOpenDialog() {
    if (isPending) {
      return;
    }

    setDeleteError(null);
    setIsDialogOpen(true);
  }

  function handleDialogChange(open: boolean) {
    if (isPending) {
      return;
    }

    setDeleteError(null);
    setIsDialogOpen(open);
  }

  function handleDelete() {
    if (deleteStartedRef.current || isPending) {
      return;
    }

    deleteStartedRef.current = true;
    setDeleteError(null);

    startDeleteTransition(async () => {
      try {
        const result = await action();
        setIsDialogOpen(false);
        router.replace(result.redirectTo);
      } catch {
        deleteStartedRef.current = false;
        setDeleteError("Nao foi possivel excluir agora. Tente novamente em alguns instantes.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        variant="destructive"
        disabled={isPending}
        onClick={handleOpenDialog}
      >
        <Trash2 className="size-4" />
        {isPending ? "Excluindo ingrediente..." : label}
      </Button>

      <ConfirmDialog
        open={isDialogOpen}
        title="Excluir ingrediente"
        description={confirmMessage}
        confirmLabel={label}
        confirmingLabel="Excluindo ingrediente..."
        isConfirming={isPending}
        errorMessage={deleteError ?? undefined}
        onConfirm={handleDelete}
        onOpenChange={handleDialogChange}
      />
    </>
  );
}

export function IngredientForm({
  mode,
  title,
  description,
  submitLabel,
  cancelHref,
  action,
  initialValues,
  latestPrice,
  categorySuggestions = [],
  deleteAction,
  deleteLabel = "Excluir ingrediente",
  deleteConfirmMessage = "Quer mesmo excluir esse ingrediente? Todo o historico dele sera removido permanentemente.",
}: IngredientFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialIngredientActionState);
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    if (!state.redirectTo) {
      return;
    }

    startTransition(() => {
      router.replace(state.redirectTo!);
    });
  }, [router, state.redirectTo]);

  const categoryDatalistId = `${mode}-ingredient-category-suggestions`;
  const canonicalCategories = useMemo(
    () =>
      new Map(
        categorySuggestions.map((category) => [normalizeCategoryKey(category), category]),
      ),
    [categorySuggestions],
  );
  const suggestedFactor = useMemo(
    () => getSuggestedConversionFactorValue(values.purchaseUnit, values.baseUnit),
    [values.baseUnit, values.purchaseUnit],
  );

  const unitCostPreview = useMemo(() => {
    const quantity = Number(values.purchaseQuantity.replace(",", "."));
    const price = Number(values.purchasePrice.replace(",", "."));
    const factor = Number(values.conversionFactor.replace(",", "."));

    if (!Number.isFinite(quantity) || !Number.isFinite(price) || !Number.isFinite(factor)) {
      return null;
    }

    if (quantity <= 0 || price <= 0 || factor <= 0) {
      return null;
    }

    return price / (quantity * factor);
  }, [values.conversionFactor, values.purchasePrice, values.purchaseQuantity]);

  function handleCategoryBlur() {
    const normalized = normalizeCategoryKey(values.category);
    const canonicalCategory = canonicalCategories.get(normalized);

    if (!canonicalCategory || canonicalCategory === values.category) {
      return;
    }

    setValues((current) => ({
      ...current,
      category: canonicalCategory,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Ingredientes
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <Button asChild variant="outline">
          <Link href={cancelHref}>
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <form
        action={formAction}
        className="space-y-6 rounded-[2rem] border border-border bg-card p-6 shadow-[0_20px_70px_-45px_rgba(51,65,85,0.4)]"
      >
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

        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do produto</Label>
            <Input
              id="name"
              name="name"
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ex.: Acucar refinado"
            />
            <FieldMessage errors={state.fieldErrors} field="name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              name="category"
              list={categorySuggestions.length > 0 ? categoryDatalistId : undefined}
              value={values.category}
              onBlur={handleCategoryBlur}
              onChange={(event) =>
                setValues((current) => ({ ...current, category: event.target.value }))
              }
              placeholder="Ex.: Liquidos, Laticinios, Secos"
            />
            {categorySuggestions.length > 0 ? (
              <datalist id={categoryDatalistId}>
                {categorySuggestions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Sugestoes existentes ajudam a manter o catalogo com a mesma escrita por categoria.
            </p>
            <FieldMessage errors={state.fieldErrors} field="category" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              name="brand"
              value={values.brand}
              onChange={(event) =>
                setValues((current) => ({ ...current, brand: event.target.value }))
              }
              placeholder="Ex.: Piracanjuba, Nestle, Qualy"
            />
            <FieldMessage errors={state.fieldErrors} field="brand" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseLocation">Local da compra</Label>
            <Input
              id="purchaseLocation"
              name="purchaseLocation"
              value={values.purchaseLocation}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  purchaseLocation: event.target.value,
                }))
              }
              placeholder="Ex.: Assai, Atacadao, Mercado do bairro"
            />
            <FieldMessage errors={state.fieldErrors} field="purchaseLocation" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="purchaseUnit">Unidade de compra</Label>
            <select
              id="purchaseUnit"
              name="purchaseUnit"
              className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/15"
              value={values.purchaseUnit}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  purchaseUnit: event.target.value as IngredientFormValues["purchaseUnit"],
                }))
              }
            >
              {purchaseUnitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldMessage errors={state.fieldErrors} field="purchaseUnit" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUnit">Unidade base de uso</Label>
            <select
              id="baseUnit"
              name="baseUnit"
              className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/15"
              value={values.baseUnit}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  baseUnit: event.target.value as IngredientFormValues["baseUnit"],
                }))
              }
            >
              {baseUnitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldMessage errors={state.fieldErrors} field="baseUnit" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseQuantity">Quantidade comprada</Label>
            <Input
              id="purchaseQuantity"
              name="purchaseQuantity"
              inputMode="decimal"
              value={values.purchaseQuantity}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  purchaseQuantity: event.target.value,
                }))
              }
              placeholder="Ex.: 1"
            />
            <FieldMessage errors={state.fieldErrors} field="purchaseQuantity" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Preco pago</Label>
            <Input
              id="purchasePrice"
              name="purchasePrice"
              inputMode="decimal"
              value={values.purchasePrice}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  purchasePrice: event.target.value,
                }))
              }
              placeholder="Ex.: 8.90"
            />
            <FieldMessage errors={state.fieldErrors} field="purchasePrice" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-2">
            <Label htmlFor="conversionFactor">Fator de conversao</Label>
            <Input
              id="conversionFactor"
              name="conversionFactor"
              inputMode="decimal"
              value={values.conversionFactor}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  conversionFactor: event.target.value,
                }))
              }
              placeholder="Ex.: 1000"
            />
            <p className="text-sm text-muted-foreground">
              Quantas unidades base existem em 1 unidade de compra. Ex.: 1 kg = 1000 g.
            </p>
            {suggestedFactor ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 underline underline-offset-4"
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    conversionFactor: suggestedFactor,
                  }))
                }
              >
                <Info className="size-4" />
                Usar conversao sugerida: {suggestedFactor}
              </button>
            ) : null}
            <FieldMessage errors={state.fieldErrors} field="conversionFactor" />
          </div>

          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <p className="text-sm text-slate-500">Previa do custo base</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {unitCostPreview !== null
                ? `R$ ${formatNumber(unitCostPreview, {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 6,
                  })} / ${baseUnitShortLabels[values.baseUnit]}`
                : "Preencha preco, quantidade e conversao"}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Compra atual: {values.purchaseQuantity || "0"}{" "}
              {purchaseUnitShortLabels[values.purchaseUnit]} por{" "}
              {values.purchasePrice
                ? formatCurrency(Number(values.purchasePrice.replace(",", ".")))
                : "R$ 0,00"}
            </p>
          </div>
        </section>

        {mode === "edit" ? (
          <section className="space-y-3 rounded-3xl border border-border bg-white p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Confirmacao de compra</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ao revisitar o produto, confirme se os dados continuam iguais ou registre uma nova
                compra para manter o historico confiavel.
              </p>
            </div>

            {latestPrice ? (
              <div className="rounded-2xl bg-[color:var(--card-muted)] p-4 text-sm text-slate-700">
                Ultimo registro em {formatDateTime(latestPrice.effectiveDate)}:{" "}
                {formatNumber(latestPrice.purchaseQuantity)} {latestPrice.purchaseUnitLabel} por{" "}
                {formatCurrency(latestPrice.purchasePrice)}. Conversao:{" "}
                {formatNumber(latestPrice.conversionFactor)} {latestPrice.baseUnitLabel} por unidade
                de compra.
                {latestPrice.brand ? ` Marca: ${latestPrice.brand}.` : ""}
                {latestPrice.purchaseLocation ? ` Local: ${latestPrice.purchaseLocation}.` : ""}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              {ingredientPriceDecisionOptions.map((option) => {
                const checked = values.priceDecision === option.value;

                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-2xl border p-4 text-sm transition-colors",
                      checked
                        ? "border-slate-900 bg-slate-950 text-white"
                        : "border-border bg-white text-slate-700",
                    )}
                  >
                    <input
                      type="radio"
                      name="priceDecision"
                      value={option.value}
                      checked={checked}
                      onChange={() =>
                        setValues((current) => ({
                          ...current,
                          priceDecision: option.value,
                        }))
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold">{option.label}</span>
                      <span
                        className={cn(
                          "mt-1 block",
                          checked ? "text-slate-300" : "text-muted-foreground",
                        )}
                      >
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ) : (
          <input type="hidden" name="priceDecision" value="changed" />
        )}

        <section className="space-y-2">
          <Label htmlFor="notes">Observacoes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={values.notes}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            placeholder="Ex.: fornecedor, observacao sobre rendimento da embalagem ou ponto de reposicao."
          />
          <FieldMessage errors={state.fieldErrors} field="notes" />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button asChild variant="outline">
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          {mode === "edit" && deleteAction ? (
            <DeleteIngredientButton
              action={deleteAction}
              confirmMessage={deleteConfirmMessage}
              label={deleteLabel}
            />
          ) : null}
          <SubmitButton
            label={submitLabel}
            pendingLabel={mode === "create" ? "Salvando ingrediente..." : "Atualizando ingrediente..."}
          />
        </div>
      </form>
    </div>
  );
}
