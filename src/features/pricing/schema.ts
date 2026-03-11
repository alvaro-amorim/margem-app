import { z } from "zod";

export type PricingActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  redirectTo?: string;
  fieldErrors?: Partial<Record<PricingFieldName, string[]>>;
};

export const initialPricingActionState: PricingActionState = {
  status: "idle",
};

const decimalPattern = /^\d+(?:\.\d{1,6})?$/;

function normalizeTextInput(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDecimalInput(value: unknown) {
  return normalizeTextInput(value).replace(",", ".");
}

function normalizeBooleanInput(value: unknown) {
  return value === "true" || value === "on" || value === "1";
}

function requiredTextField(label: string) {
  return z
    .string()
    .transform((value) => normalizeTextInput(value))
    .refine((value) => value.length > 0, `${label} e obrigatoria.`);
}

function nonNegativeDecimalField(label: string, maxDecimals: number) {
  return z
    .string()
    .transform((value) => normalizeDecimalInput(value))
    .refine((value) => value.length > 0, `${label} e obrigatorio.`)
    .refine((value) => decimalPattern.test(value), `${label} precisa ser um numero valido.`)
    .refine((value) => {
      const [, decimals] = value.split(".");
      return !decimals || decimals.length <= maxDecimals;
    }, `${label} aceita no maximo ${maxDecimals} casas decimais.`)
    .refine((value) => Number(value) >= 0, `${label} nao pode ser negativo.`);
}

function percentField(label: string) {
  return nonNegativeDecimalField(label, 2).refine(
    (value) => Number(value) <= 100,
    `${label} nao pode ser maior que 100%.`,
  );
}

export const pricingFormSchema = z
  .object({
    recipeId: requiredTextField("A receita"),
    includeIngredients: z.boolean(),
    includeWaste: z.boolean(),
    wastePercent: percentField("A perda"),
    includePackaging: z.boolean(),
    packagingCost: nonNegativeDecimalField("A embalagem", 2),
    includeLabor: z.boolean(),
    laborCost: nonNegativeDecimalField("A mao de obra", 2),
    includeEnergy: z.boolean(),
    energyCost: nonNegativeDecimalField("O gas e energia", 2),
    includeFixedOverhead: z.boolean(),
    fixedOverheadCost: nonNegativeDecimalField("O custo fixo rateado", 2),
    includeCommission: z.boolean(),
    commissionPercent: percentField("A comissao"),
    includeTax: z.boolean(),
    taxPercent: percentField("Os impostos"),
    includeTargetMargin: z.boolean(),
    targetMarginPercent: percentField("A margem alvo").refine(
      (value) => Number(value) < 100,
      "A margem alvo precisa ser menor que 100%.",
    ),
  })
  .superRefine((value, context) => {
    if (!value.includeIngredients && value.includeWaste && Number(value.wastePercent) > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["includeIngredients"],
        message: "Ative o custo dos ingredientes para aplicar perda sobre a receita.",
      });
    }
  });

export type PricingFormInput = z.infer<typeof pricingFormSchema>;
export type PricingFieldName = keyof PricingFormInput;

export function parsePricingFormData(formData: FormData) {
  const parsed = pricingFormSchema.safeParse({
    recipeId: formData.get("recipeId"),
    includeIngredients: normalizeBooleanInput(formData.get("includeIngredients")),
    includeWaste: normalizeBooleanInput(formData.get("includeWaste")),
    wastePercent: formData.get("wastePercent"),
    includePackaging: normalizeBooleanInput(formData.get("includePackaging")),
    packagingCost: formData.get("packagingCost"),
    includeLabor: normalizeBooleanInput(formData.get("includeLabor")),
    laborCost: formData.get("laborCost"),
    includeEnergy: normalizeBooleanInput(formData.get("includeEnergy")),
    energyCost: formData.get("energyCost"),
    includeFixedOverhead: normalizeBooleanInput(formData.get("includeFixedOverhead")),
    fixedOverheadCost: formData.get("fixedOverheadCost"),
    includeCommission: normalizeBooleanInput(formData.get("includeCommission")),
    commissionPercent: formData.get("commissionPercent"),
    includeTax: normalizeBooleanInput(formData.get("includeTax")),
    taxPercent: formData.get("taxPercent"),
    includeTargetMargin: normalizeBooleanInput(formData.get("includeTargetMargin")),
    targetMarginPercent: formData.get("targetMarginPercent"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      state: {
        status: "error" as const,
        message: "Revise os campos da simulacao antes de salvar.",
        fieldErrors: parsed.error.flatten().fieldErrors as PricingActionState["fieldErrors"],
      },
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}
