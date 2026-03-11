import Decimal from "decimal.js";

export type PricingEngineItem = {
  ingredientId: string;
  ingredientName: string;
  quantityInBaseUnit: number | string;
  unitCostInBaseUnit: number | string;
};

export type PricingEngineModules = {
  includeIngredients?: boolean;
  includeWaste?: boolean;
  wastePercent?: number | string;
  includePackaging?: boolean;
  packagingCost?: number | string;
  includeLabor?: boolean;
  laborCost?: number | string;
  includeEnergy?: boolean;
  energyCost?: number | string;
  includeFixedOverhead?: boolean;
  fixedOverheadCost?: number | string;
  includeCommission?: boolean;
  commissionPercent?: number | string;
  includeTax?: boolean;
  taxPercent?: number | string;
  includeTargetMargin?: boolean;
  targetMarginPercent?: number | string;
};

export type PricingEngineInput = {
  recipeName: string;
  yieldQuantity: number | string;
  servingQuantity: number | string;
  servingUnitLabel: string;
  items: PricingEngineItem[];
  modules: PricingEngineModules;
  simulationMargins?: Array<number>;
};

type DecimalMap = Record<string, Decimal>;

function toDecimal(value: Decimal.Value | undefined) {
  return new Decimal(value ?? 0);
}

function toMoney(value: Decimal) {
  return Number(value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
}

function calculateSellingPrice(costPerServing: Decimal, marginPercent: Decimal) {
  if (marginPercent.lte(0)) {
    return costPerServing;
  }

  const divisor = new Decimal(1).minus(marginPercent.div(100));

  if (divisor.lte(0)) {
    throw new Error("A margem precisa ser menor que 100%.");
  }

  return costPerServing.div(divisor);
}

export function calculateRecipePricing(input: PricingEngineInput) {
  const yieldQuantity = toDecimal(input.yieldQuantity);
  const servingQuantity = toDecimal(input.servingQuantity);

  if (yieldQuantity.lte(0)) {
    throw new Error("O rendimento total deve ser maior que zero.");
  }

  if (servingQuantity.lte(0)) {
    throw new Error("A porção vendida deve ser maior que zero.");
  }

  const totalServings = yieldQuantity.div(servingQuantity);

  if (totalServings.lte(0)) {
    throw new Error("A receita precisa gerar pelo menos uma porção válida.");
  }

  const ingredientCostTotal = input.items.reduce((accumulator, item) => {
    const quantity = toDecimal(item.quantityInBaseUnit);
    const unitCost = toDecimal(item.unitCostInBaseUnit);

    return accumulator.plus(quantity.mul(unitCost));
  }, new Decimal(0));

  const includeIngredients = input.modules.includeIngredients ?? true;
  const effectiveIngredientCost = includeIngredients ? ingredientCostTotal : new Decimal(0);
  const wasteCost =
    input.modules.includeWaste ?? true
      ? effectiveIngredientCost.mul(toDecimal(input.modules.wastePercent).div(100))
      : new Decimal(0);
  const packagingCost =
    input.modules.includePackaging ? toDecimal(input.modules.packagingCost) : new Decimal(0);
  const laborCost =
    input.modules.includeLabor ? toDecimal(input.modules.laborCost) : new Decimal(0);
  const energyCost =
    input.modules.includeEnergy ? toDecimal(input.modules.energyCost) : new Decimal(0);
  const fixedOverheadCost =
    input.modules.includeFixedOverhead
      ? toDecimal(input.modules.fixedOverheadCost)
      : new Decimal(0);

  const subtotalBeforeFees = effectiveIngredientCost
    .plus(wasteCost)
    .plus(packagingCost)
    .plus(laborCost)
    .plus(energyCost)
    .plus(fixedOverheadCost);

  const commissionCost =
    input.modules.includeCommission
      ? subtotalBeforeFees.mul(toDecimal(input.modules.commissionPercent).div(100))
      : new Decimal(0);
  const taxCost =
    input.modules.includeTax
      ? subtotalBeforeFees.plus(commissionCost).mul(toDecimal(input.modules.taxPercent).div(100))
      : new Decimal(0);

  const totalCost = subtotalBeforeFees.plus(commissionCost).plus(taxCost);
  const costPerServing = totalCost.div(totalServings);
  const targetMarginPercent = input.modules.includeTargetMargin
    ? toDecimal(input.modules.targetMarginPercent)
    : new Decimal(0);
  const suggestedPrice = calculateSellingPrice(costPerServing, targetMarginPercent);
  const simulationMargins = input.simulationMargins ?? [10, 20, 30, 40, 50];

  const breakdown: DecimalMap = {
    ingredientCostTotal,
    effectiveIngredientCost,
    wasteCost,
    packagingCost,
    laborCost,
    energyCost,
    fixedOverheadCost,
    commissionCost,
    taxCost,
    subtotalBeforeFees,
    totalCost,
    costPerServing,
    suggestedPrice,
  };

  return {
    recipeName: input.recipeName,
    servingUnitLabel: input.servingUnitLabel,
    servingsProduced: Number(totalServings.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)),
    breakdown: Object.fromEntries(
      Object.entries(breakdown).map(([key, value]) => [key, toMoney(value)]),
    ) as Record<keyof typeof breakdown, number>,
    breakEvenPrice: toMoney(costPerServing),
    suggestedPrice: toMoney(suggestedPrice),
    targetMarginPercent: Number(targetMarginPercent.toDecimalPlaces(2)),
    simulations: simulationMargins.map((margin) => {
      const marginPercent = new Decimal(margin);
      const sellingPrice = calculateSellingPrice(costPerServing, marginPercent);

      return {
        marginPercent: Number(marginPercent.toDecimalPlaces(2)),
        sellingPrice: toMoney(sellingPrice),
        profitPerServing: toMoney(sellingPrice.minus(costPerServing)),
      };
    }),
  };
}
