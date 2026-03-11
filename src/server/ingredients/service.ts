import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { IngredientFormInput } from "@/features/ingredients/schema";
import { calculateUnitCostInBaseUnit, validateUnitPair } from "@/features/units/conversion";
import { getPrisma } from "@/lib/db";

type ActorContext = {
  workspaceId: string;
  userId: string;
};

type UpdateIngredientInput = IngredientFormInput & {
  ingredientId: string;
};

function normalizeCategoryKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCategoryLabel(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((word) =>
      word.length > 0 ? word[0].toLocaleUpperCase("pt-BR") + word.slice(1) : word,
    )
    .join(" ");
}

function sameValue(left: string, right: string) {
  return left === right;
}

function sameOptionalValue(left?: string | null, right?: string) {
  return (left ?? "") === (right ?? "");
}

function hasPriceSnapshotChanged(
  current: {
    brand?: string | null;
    purchaseLocation?: string | null;
    purchaseQuantity: string;
    purchasePrice: string;
    purchaseUnit: string;
    baseUnit: string;
    conversionFactor: string;
  },
  next: IngredientFormInput,
) {
  return (
    !sameOptionalValue(current.brand, next.brand) ||
    !sameOptionalValue(current.purchaseLocation, next.purchaseLocation) ||
    !sameValue(current.purchaseQuantity, next.purchaseQuantity) ||
    !sameValue(current.purchasePrice, next.purchasePrice) ||
    current.purchaseUnit !== next.purchaseUnit ||
    current.baseUnit !== next.baseUnit ||
    !sameValue(current.conversionFactor, next.conversionFactor)
  );
}

function toEditableSnapshot(input: IngredientFormInput) {
  return {
    brand: input.brand,
    purchaseLocation: input.purchaseLocation,
    purchaseQuantity: input.purchaseQuantity,
    purchasePrice: input.purchasePrice,
    purchaseUnit: input.purchaseUnit,
    baseUnit: input.baseUnit,
    conversionFactor: input.conversionFactor,
  };
}

function buildUnitCost(input: IngredientFormInput) {
  const unitValidation = validateUnitPair(
    input.purchaseUnit,
    input.baseUnit,
    input.conversionFactor,
  );

  if (!unitValidation.valid) {
    return {
      success: false as const,
      message: unitValidation.reason,
    };
  }

  const unitCost = calculateUnitCostInBaseUnit({
    purchaseQuantity: input.purchaseQuantity,
    purchasePrice: input.purchasePrice,
    conversionFactor: input.conversionFactor,
  });

  return {
    success: true as const,
    unitCostInBaseUnit: unitCost.toDecimalPlaces(6).toString(),
  };
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function resolveCanonicalCategory(
  workspaceId: string,
  category?: string,
) {
  if (!category) {
    return undefined;
  }

  const categories = await listWorkspaceIngredientCategories(workspaceId);
  const normalizedInput = normalizeCategoryKey(category);
  const matchedCategory = categories.find(
    (entry) => normalizeCategoryKey(entry) === normalizedInput,
  );

  return matchedCategory ?? formatCategoryLabel(category);
}

export async function listWorkspaceIngredientCategories(workspaceId: string) {
  const prisma = getPrisma();
  const categories = await prisma.ingredient.findMany({
    where: {
      workspaceId,
      isActive: true,
      category: {
        not: null,
      },
    },
    select: {
      category: true,
    },
    distinct: ["category"],
    orderBy: {
      category: "asc",
    },
  });

  return categories
    .map((entry) => entry.category)
    .filter((entry): entry is string => Boolean(entry));
}

export async function listWorkspaceIngredients(workspaceId: string) {
  const prisma = getPrisma();

  return prisma.ingredient.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    orderBy: [
      {
        category: "asc",
      },
      {
        name: "asc",
      },
    ],
    include: {
      _count: {
        select: {
          priceHistory: true,
        },
      },
    },
  });
}

export async function getIngredientDetails(workspaceId: string, ingredientId: string) {
  const prisma = getPrisma();

  return prisma.ingredient.findFirst({
    where: {
      id: ingredientId,
      workspaceId,
      isActive: true,
    },
    include: {
      priceHistory: {
        orderBy: {
          effectiveDate: "desc",
        },
        take: 24,
      },
    },
  });
}

export async function createIngredient(input: IngredientFormInput, actor: ActorContext) {
  const prisma = getPrisma();
  const unitCostResult = buildUnitCost(input);

  if (!unitCostResult.success) {
    return {
      success: false as const,
      message: unitCostResult.message,
    };
  }

  const category = await resolveCanonicalCategory(actor.workspaceId, input.category);

  try {
    const ingredient = await prisma.$transaction(async (transaction) => {
      const created = await transaction.ingredient.create({
        data: {
          workspaceId: actor.workspaceId,
          createdById: actor.userId,
          name: input.name,
          category,
          brand: input.brand,
          purchaseLocation: input.purchaseLocation,
          purchaseUnit: input.purchaseUnit,
          baseUnit: input.baseUnit,
          purchaseQuantity: input.purchaseQuantity,
          purchasePrice: input.purchasePrice,
          conversionFactor: input.conversionFactor,
          unitCostInBaseUnit: unitCostResult.unitCostInBaseUnit,
          notes: input.notes,
          lastPriceConfirmedAt: new Date(),
        },
      });

      await transaction.ingredientPriceHistory.create({
        data: {
          workspaceId: actor.workspaceId,
          ingredientId: created.id,
          recordedById: actor.userId,
          brand: input.brand,
          purchaseLocation: input.purchaseLocation,
          purchaseQuantity: input.purchaseQuantity,
          purchaseUnit: input.purchaseUnit,
          baseUnit: input.baseUnit,
          conversionFactor: input.conversionFactor,
          purchasePrice: input.purchasePrice,
          unitCostInBaseUnit: unitCostResult.unitCostInBaseUnit,
          priceChanged: true,
        },
      });

      return created;
    });

    return {
      success: true as const,
      ingredientId: ingredient.id,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false as const,
        message: "Ja existe um ingrediente com esse nome no seu workspace.",
      };
    }

    throw error;
  }
}

export async function updateIngredient(input: UpdateIngredientInput, actor: ActorContext) {
  const prisma = getPrisma();
  const existingIngredient = await prisma.ingredient.findFirst({
    where: {
      id: input.ingredientId,
      workspaceId: actor.workspaceId,
      isActive: true,
    },
  });

  if (!existingIngredient) {
    return {
      success: false as const,
      message: "Ingrediente nao encontrado no seu workspace.",
    };
  }

  const unitCostResult = buildUnitCost(input);

  if (!unitCostResult.success) {
    return {
      success: false as const,
      message: unitCostResult.message,
    };
  }

  const category = await resolveCanonicalCategory(actor.workspaceId, input.category);
  const changed = hasPriceSnapshotChanged(
    {
      brand: existingIngredient.brand,
      purchaseLocation: existingIngredient.purchaseLocation,
      purchaseQuantity: existingIngredient.purchaseQuantity.toString(),
      purchasePrice: existingIngredient.purchasePrice.toString(),
      purchaseUnit: existingIngredient.purchaseUnit,
      baseUnit: existingIngredient.baseUnit,
      conversionFactor: existingIngredient.conversionFactor.toString(),
    },
    input,
  );

  if (input.priceDecision === "same" && changed) {
    return {
      success: false as const,
      message:
        "Voce alterou dados de compra (preco, marca, local ou conversao). Marque a opcao de registrar novo preco para salvar esse historico.",
    };
  }

  if (input.priceDecision === "changed" && !changed) {
    return {
      success: false as const,
      message:
        "Nenhuma alteracao de compra foi detectada. Se tudo continua igual, use a opcao de confirmacao.",
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.ingredient.update({
        where: {
          id: existingIngredient.id,
        },
        data: {
          name: input.name,
          category,
          brand: input.brand,
          purchaseLocation: input.purchaseLocation,
          purchaseUnit: input.purchaseUnit,
          baseUnit: input.baseUnit,
          purchaseQuantity: input.purchaseQuantity,
          purchasePrice: input.purchasePrice,
          conversionFactor: input.conversionFactor,
          unitCostInBaseUnit: unitCostResult.unitCostInBaseUnit,
          notes: input.notes,
          lastPriceConfirmedAt: new Date(),
        },
      });

      if (changed) {
        await transaction.ingredientPriceHistory.create({
          data: {
            workspaceId: actor.workspaceId,
            ingredientId: existingIngredient.id,
            recordedById: actor.userId,
            ...toEditableSnapshot(input),
            unitCostInBaseUnit: unitCostResult.unitCostInBaseUnit,
            priceChanged: true,
          },
        });
      }
    });

    return {
      success: true as const,
      ingredientId: existingIngredient.id,
      priceChanged: changed,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false as const,
        message: "Ja existe um ingrediente com esse nome no seu workspace.",
      };
    }

    throw error;
  }
}

export async function deleteIngredient(ingredientId: string, actor: ActorContext) {
  const prisma = getPrisma();
  const existingIngredient = await prisma.ingredient.findFirst({
    where: {
      id: ingredientId,
      workspaceId: actor.workspaceId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          recipeItems: true,
        },
      },
    },
  });

  if (!existingIngredient) {
    return {
      success: false as const,
      code: "not_found" as const,
      message: "Ingrediente nao encontrado no seu workspace.",
    };
  }

  if (existingIngredient._count.recipeItems > 0) {
    return {
      success: false as const,
      code: "recipe_in_use" as const,
      message:
        "Este ingrediente nao pode ser excluido porque ja esta vinculado a uma ou mais receitas.",
    };
  }

  await prisma.ingredient.delete({
    where: {
      id: existingIngredient.id,
    },
  });

  return {
    success: true as const,
    ingredientId: existingIngredient.id,
    ingredientName: existingIngredient.name,
  };
}
