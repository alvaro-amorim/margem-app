import { z } from "zod";

export type RecipeActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  redirectTo?: string;
  fieldErrors?: Partial<Record<RecipeFieldName, string[]>>;
  itemErrors?: string[];
};

export const initialRecipeActionState: RecipeActionState = {
  status: "idle",
};

const decimalPattern = /^\d+(?:\.\d{1,6})?$/;

function normalizeTextInput(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalTextInput(value: unknown) {
  const normalized = normalizeTextInput(value);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeDecimalInput(value: unknown) {
  return normalizeTextInput(value).replace(",", ".");
}

function decimalField(label: string, maxDecimals = 6) {
  return z
    .string()
    .transform((value) => normalizeDecimalInput(value))
    .refine((value) => value.length > 0, `${label} é obrigatório.`)
    .refine((value) => decimalPattern.test(value), `${label} precisa ser um número válido.`)
    .refine((value) => {
      const [, decimals] = value.split(".");
      return !decimals || decimals.length <= maxDecimals;
    }, `${label} aceita no máximo ${maxDecimals} casas decimais.`)
    .refine((value) => Number(value) > 0, `${label} deve ser maior que zero.`);
}

const recipeItemSchema = z.object({
  ingredientId: z
    .string()
    .transform((value) => normalizeTextInput(value))
    .refine((value) => value.length > 0, "Selecione um ingrediente para o item."),
  quantityInBaseUnit: decimalField("A quantidade do item", 3),
  notes: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalTextInput(value))
    .refine(
      (value) => !value || value.length <= 500,
      "As observações do item podem ter no máximo 500 caracteres.",
    ),
});

export const recipeFormSchema = z
  .object({
    name: z
      .string()
      .transform((value) => normalizeTextInput(value))
      .refine((value) => value.length >= 2, "Informe um nome com pelo menos 2 caracteres.")
      .refine((value) => value.length <= 120, "O nome pode ter no máximo 120 caracteres."),
    description: z
      .string()
      .optional()
      .transform((value) => normalizeOptionalTextInput(value))
      .refine((value) => !value || value.length <= 240, "A descrição pode ter no máximo 240 caracteres."),
    yieldQuantity: decimalField("O rendimento total", 3),
    yieldUnitLabel: z
      .string()
      .transform((value) => normalizeTextInput(value))
      .refine((value) => value.length >= 1, "Informe a unidade do rendimento.")
      .refine((value) => value.length <= 40, "A unidade do rendimento pode ter no máximo 40 caracteres."),
    servingQuantity: decimalField("A porção vendida", 3),
    servingUnitLabel: z
      .string()
      .transform((value) => normalizeTextInput(value))
      .refine((value) => value.length >= 1, "Informe a unidade da porção vendida.")
      .refine((value) => value.length <= 40, "A unidade da porção pode ter no máximo 40 caracteres."),
    notes: z
      .string()
      .optional()
      .transform((value) => normalizeOptionalTextInput(value))
      .refine((value) => !value || value.length <= 1000, "As observações podem ter no máximo 1000 caracteres."),
    items: z.array(recipeItemSchema).min(1, "Adicione pelo menos um ingrediente à receita."),
  })
  .superRefine((value, context) => {
    const seenIngredientIds = new Set<string>();

    value.items.forEach((item, index) => {
      if (seenIngredientIds.has(item.ingredientId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "ingredientId"],
          message: "Cada ingrediente pode aparecer apenas uma vez na receita.",
        });
      }

      seenIngredientIds.add(item.ingredientId);
    });

    if (Number(value.servingQuantity) > Number(value.yieldQuantity)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["servingQuantity"],
        message: "A porção vendida não pode ser maior que o rendimento total informado.",
      });
    }
  });

export type RecipeFormInput = z.infer<typeof recipeFormSchema>;
export type RecipeFieldName = Exclude<keyof RecipeFormInput, "items">;

function buildRecipeItemsFromFormData(formData: FormData) {
  const ingredientIds = formData.getAll("itemIngredientId");
  const quantities = formData.getAll("itemQuantityInBaseUnit");
  const notes = formData.getAll("itemNotes");
  const itemCount = Math.max(ingredientIds.length, quantities.length, notes.length);

  return Array.from({ length: itemCount }, (_, index) => ({
    ingredientId: ingredientIds[index],
    quantityInBaseUnit: quantities[index],
    notes: notes[index],
  })).filter((item) => {
    const ingredientId = normalizeTextInput(item.ingredientId);
    const quantity = normalizeTextInput(item.quantityInBaseUnit);
    const note = normalizeTextInput(item.notes);

    return ingredientId.length > 0 || quantity.length > 0 || note.length > 0;
  });
}

function extractItemErrors(error: z.ZodError) {
  return Array.from(
    new Set(
      error.issues
        .filter((issue) => issue.path[0] === "items")
        .map((issue) => issue.message),
    ),
  );
}

export function parseRecipeFormData(formData: FormData) {
  const parsed = recipeFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    yieldQuantity: formData.get("yieldQuantity"),
    yieldUnitLabel: formData.get("yieldUnitLabel"),
    servingQuantity: formData.get("servingQuantity"),
    servingUnitLabel: formData.get("servingUnitLabel"),
    notes: formData.get("notes"),
    items: buildRecipeItemsFromFormData(formData),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as RecipeActionState["fieldErrors"];

    return {
      success: false as const,
      state: {
        status: "error" as const,
        message: "Revise os campos obrigatórios da receita.",
        fieldErrors,
        itemErrors: extractItemErrors(parsed.error),
      },
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}
