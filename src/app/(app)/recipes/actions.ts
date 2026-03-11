"use server";

import { revalidatePath } from "next/cache";

import {
  initialRecipeActionState,
  parseRecipeFormData,
  type RecipeActionState,
} from "@/features/recipes/schema";
import { requireAuthenticatedContext } from "@/lib/auth";
import {
  createRecipe,
  deleteRecipe,
  getRecipeDetails,
  updateRecipe,
} from "@/server/recipes/service";

export async function createRecipeAction(
  previousState: RecipeActionState = initialRecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  void previousState;
  const parsed = parseRecipeFormData(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const { user, workspace } = await requireAuthenticatedContext();
  const result = await createRecipe(parsed.data, {
    workspaceId: workspace.id,
    userId: user.id,
  });

  if (!result.success) {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${result.recipeId}`);
  revalidatePath("/pricing");

  return {
    status: "success",
    redirectTo: `/recipes/${result.recipeId}?created=1`,
    message: "Receita cadastrada com sucesso.",
  };
}

export async function updateRecipeAction(
  recipeId: string,
  previousState: RecipeActionState = initialRecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  void previousState;
  const parsed = parseRecipeFormData(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const { user, workspace } = await requireAuthenticatedContext();
  const existingRecipe = await getRecipeDetails(workspace.id, recipeId);

  if (!existingRecipe) {
    return {
      status: "error",
      message: "Receita não encontrada no workspace atual.",
    };
  }

  const result = await updateRecipe(
    {
      recipeId,
      ...parsed.data,
    },
    {
      workspaceId: workspace.id,
      userId: user.id,
    },
  );

  if (!result.success) {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/pricing");

  return {
    status: "success",
    redirectTo: `/recipes/${recipeId}?saved=1`,
    message: "Receita atualizada com sucesso.",
  };
}

export async function deleteRecipeAction(recipeId: string) {
  const { user, workspace } = await requireAuthenticatedContext();
  const result = await deleteRecipe(recipeId, {
    workspaceId: workspace.id,
    userId: user.id,
  });

  if (!result.success) {
    return {
      redirectTo: "/recipes?deleteError=not-found",
    };
  }

  revalidatePath("/recipes");
  revalidatePath("/pricing");
  revalidatePath(`/recipes/${recipeId}`);

  return {
    redirectTo: "/recipes?deleted=1",
  };
}
