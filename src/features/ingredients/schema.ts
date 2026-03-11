import { z } from "zod";

import { BaseUnit, PurchaseUnit } from "@/generated/prisma/enums";

export type IngredientActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  redirectTo?: string;
  fieldErrors?: Partial<Record<IngredientFieldName, string[]>>;
};

export const initialIngredientActionState: IngredientActionState = {
  status: "idle",
};

export type IngredientPriceDecision = "same" | "changed";

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
    .refine((value) => value.length > 0, `${label} e obrigatorio.`)
    .refine((value) => decimalPattern.test(value), `${label} precisa ser um numero valido.`)
    .refine((value) => {
      const [, decimals] = value.split(".");
      return !decimals || decimals.length <= maxDecimals;
    }, `${label} aceita no maximo ${maxDecimals} casas decimais.`)
    .refine((value) => Number(value) > 0, `${label} deve ser maior que zero.`);
}

export const ingredientFormSchema = z.object({
  name: z
    .string()
    .transform((value) => normalizeTextInput(value))
    .refine((value) => value.length >= 2, "Informe um nome com pelo menos 2 caracteres.")
    .refine((value) => value.length <= 120, "O nome pode ter no maximo 120 caracteres."),
  category: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalTextInput(value))
    .refine((value) => !value || value.length <= 80, "A categoria pode ter no maximo 80 caracteres."),
  brand: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalTextInput(value))
    .refine((value) => !value || value.length <= 80, "A marca pode ter no maximo 80 caracteres."),
  purchaseLocation: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalTextInput(value))
    .refine(
      (value) => !value || value.length <= 120,
      "O local da compra pode ter no maximo 120 caracteres.",
    ),
  purchaseUnit: z.nativeEnum(PurchaseUnit, {
    error: "Selecione a unidade de compra.",
  }),
  baseUnit: z.nativeEnum(BaseUnit, {
    error: "Selecione a unidade base.",
  }),
  purchaseQuantity: decimalField("A quantidade comprada", 3),
  purchasePrice: decimalField("O preco pago", 2),
  conversionFactor: decimalField("O fator de conversao", 4),
  notes: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalTextInput(value))
    .refine((value) => !value || value.length <= 800, "As observacoes podem ter no maximo 800 caracteres."),
  priceDecision: z
    .enum(["same", "changed"])
    .optional()
    .transform((value) => value ?? "same"),
});

export type IngredientFormInput = z.infer<typeof ingredientFormSchema>;
export type IngredientFieldName = keyof IngredientFormInput;

export function parseIngredientFormData(formData: FormData) {
  const parsed = ingredientFormSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    brand: formData.get("brand"),
    purchaseLocation: formData.get("purchaseLocation"),
    purchaseUnit: formData.get("purchaseUnit"),
    baseUnit: formData.get("baseUnit"),
    purchaseQuantity: formData.get("purchaseQuantity"),
    purchasePrice: formData.get("purchasePrice"),
    conversionFactor: formData.get("conversionFactor"),
    notes: formData.get("notes"),
    priceDecision: formData.get("priceDecision"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      state: {
        status: "error" as const,
        message: "Revise os campos obrigatorios do ingrediente.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}
