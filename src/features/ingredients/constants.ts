import { BaseUnit, PurchaseUnit } from "@/generated/prisma/enums";

export const PACKAGING_PURCHASE_UNITS = new Set<PurchaseUnit>([
  PurchaseUnit.PACK,
  PurchaseUnit.BOX,
  PurchaseUnit.BOTTLE,
  PurchaseUnit.CAN,
  PurchaseUnit.BAG,
  PurchaseUnit.JAR,
  PurchaseUnit.POT,
  PurchaseUnit.TRAY,
  PurchaseUnit.SACK,
]);

export const DIRECT_BASE_UNIT_BY_PURCHASE_UNIT = new Map<PurchaseUnit, BaseUnit>([
  [PurchaseUnit.GRAM, BaseUnit.GRAM],
  [PurchaseUnit.KILOGRAM, BaseUnit.GRAM],
  [PurchaseUnit.MILLILITER, BaseUnit.MILLILITER],
  [PurchaseUnit.LITER, BaseUnit.MILLILITER],
  [PurchaseUnit.UNIT, BaseUnit.UNIT],
  [PurchaseUnit.DOZEN, BaseUnit.UNIT],
]);

export const STANDARD_CONVERSION_FACTORS = new Map<PurchaseUnit, string>([
  [PurchaseUnit.GRAM, "1"],
  [PurchaseUnit.KILOGRAM, "1000"],
  [PurchaseUnit.MILLILITER, "1"],
  [PurchaseUnit.LITER, "1000"],
  [PurchaseUnit.UNIT, "1"],
  [PurchaseUnit.DOZEN, "12"],
]);

export const baseUnitLabels: Record<BaseUnit, string> = {
  [BaseUnit.GRAM]: "grama",
  [BaseUnit.MILLILITER]: "mililitro",
  [BaseUnit.UNIT]: "unidade",
};

export const baseUnitShortLabels: Record<BaseUnit, string> = {
  [BaseUnit.GRAM]: "g",
  [BaseUnit.MILLILITER]: "ml",
  [BaseUnit.UNIT]: "un",
};

export const purchaseUnitLabels: Record<PurchaseUnit, string> = {
  [PurchaseUnit.GRAM]: "grama (g)",
  [PurchaseUnit.KILOGRAM]: "quilo (kg)",
  [PurchaseUnit.MILLILITER]: "mililitro (ml)",
  [PurchaseUnit.LITER]: "litro (l)",
  [PurchaseUnit.UNIT]: "unidade",
  [PurchaseUnit.DOZEN]: "dúzia",
  [PurchaseUnit.PACK]: "pacote",
  [PurchaseUnit.BOX]: "caixa",
  [PurchaseUnit.BOTTLE]: "frasco",
  [PurchaseUnit.CAN]: "lata",
  [PurchaseUnit.BAG]: "saco",
  [PurchaseUnit.JAR]: "vidro",
  [PurchaseUnit.POT]: "pote",
  [PurchaseUnit.TRAY]: "bandeja",
  [PurchaseUnit.SACK]: "sacaria",
};

export const purchaseUnitShortLabels: Record<PurchaseUnit, string> = {
  [PurchaseUnit.GRAM]: "g",
  [PurchaseUnit.KILOGRAM]: "kg",
  [PurchaseUnit.MILLILITER]: "ml",
  [PurchaseUnit.LITER]: "l",
  [PurchaseUnit.UNIT]: "un",
  [PurchaseUnit.DOZEN]: "dz",
  [PurchaseUnit.PACK]: "pct",
  [PurchaseUnit.BOX]: "cx",
  [PurchaseUnit.BOTTLE]: "frasco",
  [PurchaseUnit.CAN]: "lata",
  [PurchaseUnit.BAG]: "saco",
  [PurchaseUnit.JAR]: "vidro",
  [PurchaseUnit.POT]: "pote",
  [PurchaseUnit.TRAY]: "band",
  [PurchaseUnit.SACK]: "sacaria",
};

export const baseUnitOptions = [
  { value: BaseUnit.GRAM, label: baseUnitLabels[BaseUnit.GRAM] },
  { value: BaseUnit.MILLILITER, label: baseUnitLabels[BaseUnit.MILLILITER] },
  { value: BaseUnit.UNIT, label: baseUnitLabels[BaseUnit.UNIT] },
];

export const purchaseUnitOptions = [
  { value: PurchaseUnit.GRAM, label: purchaseUnitLabels[PurchaseUnit.GRAM] },
  { value: PurchaseUnit.KILOGRAM, label: purchaseUnitLabels[PurchaseUnit.KILOGRAM] },
  { value: PurchaseUnit.MILLILITER, label: purchaseUnitLabels[PurchaseUnit.MILLILITER] },
  { value: PurchaseUnit.LITER, label: purchaseUnitLabels[PurchaseUnit.LITER] },
  { value: PurchaseUnit.UNIT, label: purchaseUnitLabels[PurchaseUnit.UNIT] },
  { value: PurchaseUnit.DOZEN, label: purchaseUnitLabels[PurchaseUnit.DOZEN] },
  { value: PurchaseUnit.PACK, label: purchaseUnitLabels[PurchaseUnit.PACK] },
  { value: PurchaseUnit.BOX, label: purchaseUnitLabels[PurchaseUnit.BOX] },
  { value: PurchaseUnit.BOTTLE, label: purchaseUnitLabels[PurchaseUnit.BOTTLE] },
  { value: PurchaseUnit.CAN, label: purchaseUnitLabels[PurchaseUnit.CAN] },
  { value: PurchaseUnit.BAG, label: purchaseUnitLabels[PurchaseUnit.BAG] },
  { value: PurchaseUnit.JAR, label: purchaseUnitLabels[PurchaseUnit.JAR] },
  { value: PurchaseUnit.POT, label: purchaseUnitLabels[PurchaseUnit.POT] },
  { value: PurchaseUnit.TRAY, label: purchaseUnitLabels[PurchaseUnit.TRAY] },
  { value: PurchaseUnit.SACK, label: purchaseUnitLabels[PurchaseUnit.SACK] },
];

export const ingredientPriceDecisionOptions = [
  {
    value: "same",
    label: "Preço continua o mesmo",
    description: "Confirma o preço atual e atualiza apenas a data de confirmação.",
  },
  {
    value: "changed",
    label: "Registrar novo preço",
    description: "Salva um novo preço no ingrediente e cria histórico.",
  },
] as const;

export function getSuggestedConversionFactorValue(
  purchaseUnit: PurchaseUnit,
  baseUnit: BaseUnit,
) {
  if (PACKAGING_PURCHASE_UNITS.has(purchaseUnit)) {
    return null;
  }

  const expectedBaseUnit = DIRECT_BASE_UNIT_BY_PURCHASE_UNIT.get(purchaseUnit);

  if (!expectedBaseUnit || expectedBaseUnit !== baseUnit) {
    return null;
  }

  return STANDARD_CONVERSION_FACTORS.get(purchaseUnit) ?? null;
}
