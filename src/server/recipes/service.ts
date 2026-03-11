import "server-only";

import Decimal from "decimal.js";

import { calculateRecipePricing, type PricingEngineInput } from "@/features/pricing/engine";
import type { PricingFormInput } from "@/features/pricing/schema";
import type { RecipeFormInput } from "@/features/recipes/schema";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";

type ActorContext = {
  workspaceId: string;
  userId: string;
};

type UpdateRecipeInput = RecipeFormInput & {
  recipeId: string;
};

type PricingDefaults = {
  includeIngredients: boolean;
  includeWaste: boolean;
  wastePercent: string;
  includePackaging: boolean;
  packagingCost: string;
  includeLabor: boolean;
  laborCost: string;
  includeEnergy: boolean;
  energyCost: string;
  includeFixedOverhead: boolean;
  fixedOverheadCost: string;
  includeCommission: boolean;
  commissionPercent: string;
  includeTax: boolean;
  taxPercent: string;
  includeTargetMargin: boolean;
  targetMarginPercent: string;
};

type PricingSettingsClient = Pick<ReturnType<typeof getPrisma>, "pricingSettings">;
type IngredientClient = Pick<ReturnType<typeof getPrisma>, "ingredient">;

type PricingRunResultSnapshot = ReturnType<typeof calculateRecipePricing>;

function toDecimal(value: Decimal.Value) {
  return new Decimal(value);
}

function toMoney(value: Decimal) {
  return Number(value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
}

function calculateIngredientCostTotal(
  items: Array<{
    quantityInBaseUnit: Decimal.Value;
    ingredient: {
      unitCostInBaseUnit: Decimal.Value;
    };
  }>,
) {
  return items.reduce((accumulator, item) => {
    return accumulator.plus(
      toDecimal(item.quantityInBaseUnit).mul(toDecimal(item.ingredient.unitCostInBaseUnit)),
    );
  }, new Decimal(0));
}

function buildRecipePricingDefaults(settings?: {
  wastePercent: Decimal.Value;
  packagingCost: Decimal.Value;
  laborCost: Decimal.Value;
  energyCost: Decimal.Value;
  fixedOverheadCost: Decimal.Value;
  commissionPercent: Decimal.Value;
  taxPercent: Decimal.Value;
  targetMarginPercent: Decimal.Value;
  includePackaging: boolean;
  includeLabor: boolean;
  includeEnergy: boolean;
  includeFixedOverhead: boolean;
  includeCommission: boolean;
  includeTax: boolean;
  includeTargetMargin: boolean;
} | null): PricingDefaults {
  return {
    includeIngredients: true,
    includeWaste: true,
    wastePercent: settings?.wastePercent?.toString() ?? "0",
    includePackaging: settings?.includePackaging ?? false,
    packagingCost: settings?.packagingCost?.toString() ?? "0",
    includeLabor: settings?.includeLabor ?? false,
    laborCost: settings?.laborCost?.toString() ?? "0",
    includeEnergy: settings?.includeEnergy ?? false,
    energyCost: settings?.energyCost?.toString() ?? "0",
    includeFixedOverhead: settings?.includeFixedOverhead ?? false,
    fixedOverheadCost: settings?.fixedOverheadCost?.toString() ?? "0",
    includeCommission: settings?.includeCommission ?? false,
    commissionPercent: settings?.commissionPercent?.toString() ?? "0",
    includeTax: settings?.includeTax ?? false,
    taxPercent: settings?.taxPercent?.toString() ?? "0",
    includeTargetMargin: settings?.includeTargetMargin ?? true,
    targetMarginPercent: settings?.targetMarginPercent?.toString() ?? "0",
  };
}

async function loadWorkspacePricingDefaults(
  workspaceId: string,
  prismaClient: PricingSettingsClient,
) {
  const settings = await prismaClient.pricingSettings.findUnique({
    where: {
      workspaceId,
    },
  });

  return buildRecipePricingDefaults(settings);
}

async function resolveRecipeIngredients(
  workspaceId: string,
  items: RecipeFormInput["items"],
  prismaClient: IngredientClient,
) {
  const ingredientIds = Array.from(new Set(items.map((item) => item.ingredientId)));
  const ingredients = await prismaClient.ingredient.findMany({
    where: {
      workspaceId,
      isActive: true,
      id: {
        in: ingredientIds,
      },
    },
    select: {
      id: true,
      name: true,
      baseUnit: true,
      unitCostInBaseUnit: true,
    },
  });

  if (ingredients.length !== ingredientIds.length) {
    return {
      success: false as const,
      message: "Um ou mais ingredientes selecionados não pertencem ao workspace atual.",
    };
  }

  return {
    success: true as const,
    ingredientsById: new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])),
  };
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function listRecipeIngredientOptions(workspaceId: string) {
  const prisma = getPrisma();

  return prisma.ingredient.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      category: true,
      baseUnit: true,
      unitCostInBaseUnit: true,
    },
  });
}

export async function listWorkspaceRecipes(workspaceId: string) {
  const prisma = getPrisma();
  const recipes = await prisma.recipe.findMany({
    where: {
      workspaceId,
      isArchived: false,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      items: {
        include: {
          ingredient: {
            select: {
              id: true,
              unitCostInBaseUnit: true,
            },
          },
        },
      },
    },
  });

  return recipes.map((recipe) => {
    const ingredientCostTotal = calculateIngredientCostTotal(recipe.items);
    const servingsProduced = toDecimal(recipe.yieldQuantity).div(recipe.servingQuantity);

    return {
      ...recipe,
      itemCount: recipe.items.length,
      ingredientCostTotal: toMoney(ingredientCostTotal),
      servingsProduced: Number(servingsProduced.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)),
    };
  });
}

export async function getRecipeDetails(workspaceId: string, recipeId: string) {
  const prisma = getPrisma();

  return prisma.recipe.findFirst({
    where: {
      id: recipeId,
      workspaceId,
      isArchived: false,
    },
    include: {
      items: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
              category: true,
              baseUnit: true,
              unitCostInBaseUnit: true,
            },
          },
        },
      },
      pricingProfile: true,
      workspace: {
        select: {
          pricingSettings: true,
        },
      },
    },
  });
}

export async function createRecipe(input: RecipeFormInput, actor: ActorContext) {
  const prisma = getPrisma();
  const ingredientResolution = await resolveRecipeIngredients(actor.workspaceId, input.items, prisma);

  if (!ingredientResolution.success) {
    return ingredientResolution;
  }

  try {
    const createdRecipe = await prisma.$transaction(async (transaction) => {
      const pricingDefaults = await loadWorkspacePricingDefaults(actor.workspaceId, transaction);

      return transaction.recipe.create({
        data: {
          workspaceId: actor.workspaceId,
          createdById: actor.userId,
          name: input.name,
          description: input.description,
          yieldQuantity: input.yieldQuantity,
          yieldUnitLabel: input.yieldUnitLabel,
          servingQuantity: input.servingQuantity,
          servingUnitLabel: input.servingUnitLabel,
          notes: input.notes,
          items: {
            create: input.items.map((item, index) => ({
              ingredientId: item.ingredientId,
              quantityInBaseUnit: item.quantityInBaseUnit,
              notes: item.notes,
              sortOrder: index,
            })),
          },
          pricingProfile: {
            create: {
              workspaceId: actor.workspaceId,
              ...pricingDefaults,
            },
          },
        },
        select: {
          id: true,
        },
      });
    });

    return {
      success: true as const,
      recipeId: createdRecipe.id,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false as const,
        message: "Já existe uma receita com esse nome no seu workspace.",
      };
    }

    throw error;
  }
}

export async function updateRecipe(input: UpdateRecipeInput, actor: ActorContext) {
  const prisma = getPrisma();
  const existingRecipe = await prisma.recipe.findFirst({
    where: {
      id: input.recipeId,
      workspaceId: actor.workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
      workspaceId: true,
    },
  });

  if (!existingRecipe) {
    return {
      success: false as const,
      message: "Receita não encontrada no seu workspace.",
    };
  }

  const ingredientResolution = await resolveRecipeIngredients(actor.workspaceId, input.items, prisma);

  if (!ingredientResolution.success) {
    return ingredientResolution;
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const pricingDefaults = await loadWorkspacePricingDefaults(actor.workspaceId, transaction);

      await transaction.recipe.update({
        where: {
          id: existingRecipe.id,
        },
        data: {
          name: input.name,
          description: input.description,
          yieldQuantity: input.yieldQuantity,
          yieldUnitLabel: input.yieldUnitLabel,
          servingQuantity: input.servingQuantity,
          servingUnitLabel: input.servingUnitLabel,
          notes: input.notes,
          items: {
            deleteMany: {},
            create: input.items.map((item, index) => ({
              ingredientId: item.ingredientId,
              quantityInBaseUnit: item.quantityInBaseUnit,
              notes: item.notes,
              sortOrder: index,
            })),
          },
          pricingProfile: {
            upsert: {
              create: {
                workspaceId: actor.workspaceId,
                ...pricingDefaults,
              },
              update: {},
            },
          },
        },
      });
    });

    return {
      success: true as const,
      recipeId: existingRecipe.id,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false as const,
        message: "Já existe uma receita com esse nome no seu workspace.",
      };
    }

    throw error;
  }
}

export async function deleteRecipe(recipeId: string, actor: ActorContext) {
  const prisma = getPrisma();
  const existingRecipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      workspaceId: actor.workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!existingRecipe) {
    return {
      success: false as const,
      code: "not_found" as const,
      message: "Receita nao encontrada no seu workspace.",
    };
  }

  await prisma.recipe.delete({
    where: {
      id: existingRecipe.id,
    },
  });

  return {
    success: true as const,
    recipeId: existingRecipe.id,
    recipeName: existingRecipe.name,
  };
}

export type RecipePricingContext = {
  recipe: {
    id: string;
    name: string;
    description?: string | null;
    yieldQuantity: string;
    yieldUnitLabel: string;
    servingQuantity: string;
    servingUnitLabel: string;
    notes?: string | null;
  };
  input: PricingEngineInput;
};

export async function getRecipePricingContext(workspaceId: string, recipeId: string) {
  const recipe = await getRecipeDetails(workspaceId, recipeId);

  if (!recipe) {
    return null;
  }

  const pricingSource = recipe.pricingProfile ?? buildRecipePricingDefaults(recipe.workspace.pricingSettings);

  return {
    recipe: {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      yieldQuantity: recipe.yieldQuantity.toString(),
      yieldUnitLabel: recipe.yieldUnitLabel,
      servingQuantity: recipe.servingQuantity.toString(),
      servingUnitLabel: recipe.servingUnitLabel,
      notes: recipe.notes,
    },
    input: {
      recipeName: recipe.name,
      yieldQuantity: recipe.yieldQuantity.toString(),
      servingQuantity: recipe.servingQuantity.toString(),
      servingUnitLabel: recipe.servingUnitLabel,
      items: recipe.items.map((item) => ({
        ingredientId: item.ingredient.id,
        ingredientName: item.ingredient.name,
        quantityInBaseUnit: item.quantityInBaseUnit.toString(),
        unitCostInBaseUnit: item.ingredient.unitCostInBaseUnit.toString(),
      })),
      modules: {
        includeIngredients: pricingSource.includeIngredients,
        includeWaste: pricingSource.includeWaste,
        wastePercent: pricingSource.wastePercent.toString(),
        includePackaging: pricingSource.includePackaging,
        packagingCost: pricingSource.packagingCost.toString(),
        includeLabor: pricingSource.includeLabor,
        laborCost: pricingSource.laborCost.toString(),
        includeEnergy: pricingSource.includeEnergy,
        energyCost: pricingSource.energyCost.toString(),
        includeFixedOverhead: pricingSource.includeFixedOverhead,
        fixedOverheadCost: pricingSource.fixedOverheadCost.toString(),
        includeCommission: pricingSource.includeCommission,
        commissionPercent: pricingSource.commissionPercent.toString(),
        includeTax: pricingSource.includeTax,
        taxPercent: pricingSource.taxPercent.toString(),
        includeTargetMargin: pricingSource.includeTargetMargin,
        targetMarginPercent: pricingSource.targetMarginPercent.toString(),
      },
    },
  } satisfies RecipePricingContext;
}

function formatUserDisplayName(user?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();

  if (fullName.length > 0) {
    return fullName;
  }

  return user?.email ?? "Sistema";
}

export async function listRecipePricingRuns(workspaceId: string, recipeId: string) {
  const prisma = getPrisma();
  const runs = await prisma.pricingRun.findMany({
    where: {
      workspaceId,
      recipeId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
    select: {
      id: true,
      recipeId: true,
      recipeName: true,
      snapshotVersion: true,
      ingredientCostTotal: true,
      additionalCostTotal: true,
      totalCost: true,
      costPerServing: true,
      breakEvenPrice: true,
      suggestedPrice: true,
      targetMarginPercent: true,
      createdAt: true,
      inputSnapshot: true,
      resultSnapshot: true,
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return runs.map((run) => ({
    id: run.id,
    recipeId: run.recipeId,
    recipeName: run.recipeName,
    snapshotVersion: run.snapshotVersion,
    ingredientCostTotal: Number(run.ingredientCostTotal.toString()),
    additionalCostTotal: Number(run.additionalCostTotal.toString()),
    totalCost: Number(run.totalCost.toString()),
    costPerServing: Number(run.costPerServing.toString()),
    breakEvenPrice: Number(run.breakEvenPrice.toString()),
    suggestedPrice: Number(run.suggestedPrice.toString()),
    targetMarginPercent: Number(run.targetMarginPercent.toString()),
    createdAt: run.createdAt,
    createdByName: formatUserDisplayName(run.createdBy),
    inputSnapshot: run.inputSnapshot as {
      recipe: RecipePricingContext["recipe"] & {
        description: string | null;
        notes: string | null;
      };
      modules: PricingFormInput;
      items: PricingEngineInput["items"];
    },
    resultSnapshot: run.resultSnapshot as PricingRunResultSnapshot,
  }));
}

export async function createPricingRun(input: PricingFormInput, actor: ActorContext) {
  const prisma = getPrisma();
  const recipeContext = await getRecipePricingContext(actor.workspaceId, input.recipeId);

  if (!recipeContext) {
    return {
      success: false as const,
      message: "Receita nao encontrada no workspace atual.",
    };
  }

  const modules = {
    includeIngredients: input.includeIngredients,
    includeWaste: input.includeWaste,
    wastePercent: input.wastePercent,
    includePackaging: input.includePackaging,
    packagingCost: input.packagingCost,
    includeLabor: input.includeLabor,
    laborCost: input.laborCost,
    includeEnergy: input.includeEnergy,
    energyCost: input.energyCost,
    includeFixedOverhead: input.includeFixedOverhead,
    fixedOverheadCost: input.fixedOverheadCost,
    includeCommission: input.includeCommission,
    commissionPercent: input.commissionPercent,
    includeTax: input.includeTax,
    taxPercent: input.taxPercent,
    includeTargetMargin: input.includeTargetMargin,
    targetMarginPercent: input.targetMarginPercent,
  } satisfies PricingDefaults;

  try {
    const result = calculateRecipePricing({
      ...recipeContext.input,
      modules,
    });

    const createdRun = await prisma.$transaction(async (transaction) => {
      const latestRun = await transaction.pricingRun.findFirst({
        where: {
          workspaceId: actor.workspaceId,
          recipeId: input.recipeId,
        },
        orderBy: {
          snapshotVersion: "desc",
        },
        select: {
          snapshotVersion: true,
        },
      });

      await transaction.recipePricingProfile.upsert({
        where: {
          recipeId: input.recipeId,
        },
        create: {
          workspaceId: actor.workspaceId,
          recipeId: input.recipeId,
          ...modules,
        },
        update: modules,
      });

      return transaction.pricingRun.create({
        data: {
          workspaceId: actor.workspaceId,
          recipeId: input.recipeId,
          createdById: actor.userId,
          snapshotVersion: (latestRun?.snapshotVersion ?? 0) + 1,
          recipeName: recipeContext.recipe.name,
          yieldQuantity: recipeContext.recipe.yieldQuantity,
          yieldUnitLabel: recipeContext.recipe.yieldUnitLabel,
          servingQuantity: recipeContext.recipe.servingQuantity,
          servingUnitLabel: recipeContext.recipe.servingUnitLabel,
          ingredientCostTotal: result.breakdown.effectiveIngredientCost,
          additionalCostTotal:
            result.breakdown.totalCost - result.breakdown.effectiveIngredientCost,
          totalCost: result.breakdown.totalCost,
          costPerServing: result.breakEvenPrice,
          breakEvenPrice: result.breakEvenPrice,
          suggestedPrice: result.suggestedPrice,
          targetMarginPercent: result.targetMarginPercent,
          inputSnapshot: {
            recipe: {
              ...recipeContext.recipe,
              description: recipeContext.recipe.description ?? null,
              notes: recipeContext.recipe.notes ?? null,
            },
            items: recipeContext.input.items,
            modules: {
              recipeId: input.recipeId,
              ...modules,
            },
          },
          resultSnapshot: result,
        },
        select: {
          id: true,
        },
      });
    });

    return {
      success: true as const,
      recipeId: input.recipeId,
      runId: createdRun.id,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false as const,
        message: error.message,
      };
    }

    throw error;
  }
}
