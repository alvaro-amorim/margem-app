"use server";

import { revalidatePath } from "next/cache";

import {
  initialIngredientActionState,
  parseIngredientFormData,
  type IngredientActionState,
} from "@/features/ingredients/schema";
import { requireAuthenticatedContext } from "@/lib/auth";
import {
  createIngredient,
  deleteIngredient,
  getIngredientDetails,
  updateIngredient,
} from "@/server/ingredients/service";

export async function createIngredientAction(
  previousState: IngredientActionState = initialIngredientActionState,
  formData: FormData,
): Promise<IngredientActionState> {
  void previousState;
  const parsed = parseIngredientFormData(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const { user, workspace } = await requireAuthenticatedContext();
  const result = await createIngredient(parsed.data, {
    workspaceId: workspace.id,
    userId: user.id,
  });

  if (!result.success) {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/ingredients");
  revalidatePath("/products");
  revalidatePath(`/ingredients/${result.ingredientId}`);
  revalidatePath(`/products/${result.ingredientId}`);

  return {
    status: "success",
    redirectTo: "/ingredients/new?created=1",
    message: "Ingrediente cadastrado com sucesso. Formulario pronto para o proximo cadastro.",
  };
}

export async function updateIngredientAction(
  ingredientId: string,
  previousState: IngredientActionState = initialIngredientActionState,
  formData: FormData,
): Promise<IngredientActionState> {
  void previousState;
  const parsed = parseIngredientFormData(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const { user, workspace } = await requireAuthenticatedContext();
  const existingIngredient = await getIngredientDetails(workspace.id, ingredientId);

  if (!existingIngredient) {
    return {
      status: "error",
      message: "Ingrediente nao encontrado no workspace atual.",
    };
  }

  const result = await updateIngredient(
    {
      ingredientId,
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

  revalidatePath("/ingredients");
  revalidatePath("/products");
  revalidatePath(`/ingredients/${ingredientId}`);
  revalidatePath(`/products/${ingredientId}`);

  return {
    status: "success",
    redirectTo: `/ingredients/${ingredientId}?saved=1`,
    message: result.priceChanged
      ? "Ingrediente e historico de preco atualizados com sucesso."
      : "Ingrediente atualizado e preco atual confirmado.",
  };
}

export async function deleteIngredientAction(ingredientId: string) {
  const { user, workspace } = await requireAuthenticatedContext();
  const result = await deleteIngredient(ingredientId, {
    workspaceId: workspace.id,
    userId: user.id,
  });

  if (!result.success) {
    if (result.code === "recipe_in_use") {
      return {
        redirectTo: `/ingredients/${ingredientId}?deleteError=recipe-in-use`,
      };
    }

    return {
      redirectTo: "/products?deleted=1",
    };
  }

  revalidatePath("/ingredients");
  revalidatePath("/products");
  revalidatePath(`/ingredients/${ingredientId}`);
  revalidatePath(`/products/${ingredientId}`);

  return {
    redirectTo: "/products?deleted=1",
  };
}
