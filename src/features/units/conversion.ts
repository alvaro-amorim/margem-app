import Decimal from "decimal.js";

import {
  DIRECT_BASE_UNIT_BY_PURCHASE_UNIT,
  getSuggestedConversionFactorValue,
  PACKAGING_PURCHASE_UNITS,
} from "@/features/ingredients/constants";
import { BaseUnit, PurchaseUnit } from "@/generated/prisma/enums";

type UnitCostInput = {
  purchaseQuantity: Decimal.Value;
  purchasePrice: Decimal.Value;
  conversionFactor: Decimal.Value;
};

export function getSuggestedConversionFactor(
  purchaseUnit: PurchaseUnit,
  baseUnit: BaseUnit,
) {
  const suggestedValue = getSuggestedConversionFactorValue(purchaseUnit, baseUnit);
  return suggestedValue ? new Decimal(suggestedValue) : null;
}

export function validateUnitPair(
  purchaseUnit: PurchaseUnit,
  baseUnit: BaseUnit,
  conversionFactor: Decimal.Value,
) {
  const factor = new Decimal(conversionFactor);

  if (factor.lte(0)) {
    return {
      valid: false,
      reason: "O fator de conversão deve ser maior que zero.",
    };
  }

  if (PACKAGING_PURCHASE_UNITS.has(purchaseUnit)) {
    return { valid: true };
  }

  const expectedBaseUnit = DIRECT_BASE_UNIT_BY_PURCHASE_UNIT.get(purchaseUnit);

  if (!expectedBaseUnit) {
    return {
      valid: false,
      reason: "Unidade de compra não suportada.",
    };
  }

  if (expectedBaseUnit !== baseUnit) {
    return {
      valid: false,
      reason: "A unidade base não combina com a unidade de compra selecionada.",
    };
  }

  return { valid: true };
}

export function calculateUnitCostInBaseUnit(input: UnitCostInput) {
  const purchaseQuantity = new Decimal(input.purchaseQuantity);
  const purchasePrice = new Decimal(input.purchasePrice);
  const conversionFactor = new Decimal(input.conversionFactor);

  const totalBaseUnits = purchaseQuantity.mul(conversionFactor);

  if (totalBaseUnits.lte(0)) {
    throw new Error("A quantidade convertida precisa ser maior que zero.");
  }

  return purchasePrice.div(totalBaseUnits);
}
