"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, CookingPot, Plus, Trash2 } from "lucide-react";

import {
  initialRecipeActionState,
  type RecipeActionState,
} from "@/features/recipes/schema";
import type { BaseUnit } from "@/generated/prisma/enums";
import { baseUnitShortLabels } from "@/features/ingredients/constants";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type RecipeFormIngredientOption = {
  id: string;
  name: string;
  category: string | null;
  baseUnit: BaseUnit;
  unitCostInBaseUnit: number;
};

export type RecipeFormItemValue = {
  id: string;
  ingredientId: string;
  quantityInBaseUnit: string;
  notes: string;
};

export type RecipeFormValues = {
  name: string;
  description: string;
  yieldQuantity: string;
  yieldUnitLabel: string;
  servingQuantity: string;
  servingUnitLabel: string;
  notes: string;
  items: RecipeFormItemValue[];
};

type RecipeFormProps = {
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  cancelHref: string;
  action: (
    state: RecipeActionState,
    formData: FormData,
  ) => Promise<RecipeActionState>;
  initialValues: RecipeFormValues;
  availableIngredients: RecipeFormIngredientOption[];
  deleteAction?: () => Promise<{
    redirectTo: string;
  }>;
  deleteLabel?: string;
  deleteConfirmMessage?: string;
};

function createEmptyItem(id: string): RecipeFormItemValue {
  return {
    id,
    ingredientId: "",
    quantityInBaseUnit: "",
    notes: "",
  };
}

function FieldMessage({
  errors,
  field,
}: {
  errors?: RecipeActionState["fieldErrors"];
  field: keyof NonNullable<RecipeActionState["fieldErrors"]>;
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
  disabled,
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending || disabled}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function DeleteRecipeButton({
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
        {isPending ? "Excluindo receita..." : label}
      </Button>

      <ConfirmDialog
        open={isDialogOpen}
        title="Excluir receita"
        description={confirmMessage}
        confirmLabel={label}
        confirmingLabel="Excluindo receita..."
        isConfirming={isPending}
        errorMessage={deleteError ?? undefined}
        onConfirm={handleDelete}
        onOpenChange={handleDialogChange}
      />
    </>
  );
}

export function RecipeForm({
  mode,
  title,
  description,
  submitLabel,
  cancelHref,
  action,
  initialValues,
  availableIngredients,
  deleteAction,
  deleteLabel = "Excluir receita",
  deleteConfirmMessage = "Quer mesmo excluir essa receita? Todos os itens, simulacoes e o perfil de precificacao vinculados a ela serao removidos permanentemente.",
}: RecipeFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialRecipeActionState);
  const [values, setValues] = useState(initialValues);
  const nextItemId = useRef(initialValues.items.length + 1);
  const hasIngredients = availableIngredients.length > 0;

  useEffect(() => {
    if (!state.redirectTo) {
      return;
    }

    startTransition(() => {
      router.replace(state.redirectTo!);
    });
  }, [router, state.redirectTo]);

  const ingredientsById = new Map(
    availableIngredients.map((ingredient) => [ingredient.id, ingredient]),
  );

  const itemCostTotal = values.items.reduce((accumulator, item) => {
    const ingredient = ingredientsById.get(item.ingredientId);
    const quantity = Number(item.quantityInBaseUnit.replace(",", "."));

    if (!ingredient || !Number.isFinite(quantity) || quantity <= 0) {
      return accumulator;
    }

    return accumulator + quantity * ingredient.unitCostInBaseUnit;
  }, 0);

  const servingsProduced = (() => {
    const yieldQuantity = Number(values.yieldQuantity.replace(",", "."));
    const servingQuantity = Number(values.servingQuantity.replace(",", "."));

    if (!Number.isFinite(yieldQuantity) || !Number.isFinite(servingQuantity)) {
      return null;
    }

    if (yieldQuantity <= 0 || servingQuantity <= 0) {
      return null;
    }

    return yieldQuantity / servingQuantity;
  })();

  function appendItem() {
    setValues((current) => ({
      ...current,
      items: [...current.items, createEmptyItem(`new-${nextItemId.current++}`)],
    }));
  }

  function updateItem(
    itemId: string,
    field: keyof Omit<RecipeFormItemValue, "id">,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  }

  function removeItem(itemId: string) {
    setValues((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((item) => item.id !== itemId),
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Receitas
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
            <Label htmlFor="name">Nome da receita</Label>
            <Input
              id="name"
              name="name"
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ex.: Bolo de cenoura"
            />
            <FieldMessage errors={state.fieldErrors} field="name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição curta</Label>
            <Input
              id="description"
              name="description"
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Ex.: versão clássica para venda em fatias"
            />
            <FieldMessage errors={state.fieldErrors} field="description" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="yieldQuantity">Rendimento total</Label>
              <Input
                id="yieldQuantity"
                name="yieldQuantity"
                inputMode="decimal"
                value={values.yieldQuantity}
                onChange={(event) =>
                  setValues((current) => ({ ...current, yieldQuantity: event.target.value }))
                }
                placeholder="Ex.: 12"
              />
              <FieldMessage errors={state.fieldErrors} field="yieldQuantity" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yieldUnitLabel">Unidade do rendimento</Label>
              <Input
                id="yieldUnitLabel"
                name="yieldUnitLabel"
                value={values.yieldUnitLabel}
                onChange={(event) =>
                  setValues((current) => ({ ...current, yieldUnitLabel: event.target.value }))
                }
                placeholder="Ex.: fatias, unidades, ml"
              />
              <FieldMessage errors={state.fieldErrors} field="yieldUnitLabel" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servingQuantity">Porção vendida</Label>
              <Input
                id="servingQuantity"
                name="servingQuantity"
                inputMode="decimal"
                value={values.servingQuantity}
                onChange={(event) =>
                  setValues((current) => ({ ...current, servingQuantity: event.target.value }))
                }
                placeholder="Ex.: 1"
              />
              <FieldMessage errors={state.fieldErrors} field="servingQuantity" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servingUnitLabel">Unidade da porção</Label>
              <Input
                id="servingUnitLabel"
                name="servingUnitLabel"
                value={values.servingUnitLabel}
                onChange={(event) =>
                  setValues((current) => ({ ...current, servingUnitLabel: event.target.value }))
                }
                placeholder="Ex.: fatia, unidade, copo"
              />
              <FieldMessage errors={state.fieldErrors} field="servingUnitLabel" />
            </div>

            <p className="text-sm text-muted-foreground md:col-span-2">
              Use rendimento e porção na mesma referência de comparação para a engine calcular
              corretamente o número de porções produzidas.
            </p>
          </div>

          <div className="rounded-3xl bg-[color:var(--card-muted)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white">
                <CookingPot className="size-5 text-slate-900" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Prévia operacional</p>
                <p className="text-lg font-semibold text-slate-950">
                  {servingsProduced !== null
                    ? `${formatNumber(servingsProduced, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })} porções`
                    : "Informe rendimento e porção"}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <p>
                Custo base dos itens:{" "}
                <strong className="text-slate-950">{formatCurrency(itemCostTotal)}</strong>
              </p>
              <p>
                Itens preenchidos:{" "}
                <strong className="text-slate-950">
                  {values.items.filter((item) => item.ingredientId).length}
                </strong>
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-border bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Itens da receita</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione ingredientes existentes e informe a quantidade em unidade base.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={appendItem} disabled={!hasIngredients}>
              <Plus className="size-4" />
              Adicionar item
            </Button>
          </div>

          {!hasIngredients ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Você precisa cadastrar ao menos um ingrediente antes de montar uma receita.
            </div>
          ) : null}

          {state.itemErrors?.length ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.itemErrors.join(" ")}
            </div>
          ) : null}

          <div className="space-y-4">
            {values.items.map((item, index) => {
              const ingredient = ingredientsById.get(item.ingredientId);
              const quantity = Number(item.quantityInBaseUnit.replace(",", "."));
              const itemCost =
                ingredient && Number.isFinite(quantity) && quantity > 0
                  ? quantity * ingredient.unitCostInBaseUnit
                  : null;

              return (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-3xl border border-border bg-[color:var(--card-muted)] p-4 lg:grid-cols-[1.1fr_0.7fr_0.9fr_auto]"
                >
                  <div className="space-y-2">
                    <Label htmlFor={`itemIngredientId-${item.id}`}>Ingrediente {index + 1}</Label>
                    <select
                      id={`itemIngredientId-${item.id}`}
                      name="itemIngredientId"
                      className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/15"
                      value={item.ingredientId}
                      onChange={(event) => updateItem(item.id, "ingredientId", event.target.value)}
                    >
                      <option value="">Selecione um ingrediente</option>
                      {availableIngredients.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                          {option.category ? ` • ${option.category}` : ""}
                        </option>
                      ))}
                    </select>
                    {ingredient ? (
                      <p className="text-sm text-slate-600">
                        Unidade base: {baseUnitShortLabels[ingredient.baseUnit]} • custo atual{" "}
                        {formatCurrency(ingredient.unitCostInBaseUnit)}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`itemQuantity-${item.id}`}>Quantidade em unidade base</Label>
                    <Input
                      id={`itemQuantity-${item.id}`}
                      name="itemQuantityInBaseUnit"
                      inputMode="decimal"
                      value={item.quantityInBaseUnit}
                      onChange={(event) =>
                        updateItem(item.id, "quantityInBaseUnit", event.target.value)
                      }
                      placeholder={
                        ingredient ? `Ex.: 250 ${baseUnitShortLabels[ingredient.baseUnit]}` : "Ex.: 250"
                      }
                    />
                    {ingredient ? (
                      <p className="text-sm text-slate-600">
                        Informe em {baseUnitShortLabels[ingredient.baseUnit]}.
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`itemNotes-${item.id}`}>Observações do item</Label>
                    <Input
                      id={`itemNotes-${item.id}`}
                      name="itemNotes"
                      value={item.notes}
                      onChange={(event) => updateItem(item.id, "notes", event.target.value)}
                      placeholder="Ex.: peneirar antes, usar frio"
                    />
                    <p className="text-sm text-slate-600">
                      {itemCost !== null
                        ? `Custo estimado: ${formatCurrency(itemCost)}`
                        : "O custo será calculado após selecionar ingrediente e quantidade."}
                    </p>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={values.items.length === 1}
                      aria-label={`Remover item ${index + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <Label htmlFor="notes">Observações da receita</Label>
          <Textarea
            id="notes"
            name="notes"
            value={values.notes}
            onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Ex.: instruções internas, ponto ideal, armazenamento, observações para custo."
          />
          <FieldMessage errors={state.fieldErrors} field="notes" />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button asChild variant="outline">
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          {mode === "edit" && deleteAction ? (
            <DeleteRecipeButton
              action={deleteAction}
              confirmMessage={deleteConfirmMessage}
              label={deleteLabel}
            />
          ) : null}
          <SubmitButton
            label={submitLabel}
            pendingLabel={mode === "create" ? "Salvando receita..." : "Atualizando receita..."}
            disabled={!hasIngredients}
          />
        </div>
      </form>
    </div>
  );
}
