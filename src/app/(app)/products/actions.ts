"use server";

import { revalidatePath } from "next/cache";

import {
  initialIngredientActionState,
  parseIngredientFormData,
  type IngredientActionState,
} from "@/features/ingredients/schema";
import { requireAuthenticatedContext } from "@/lib/auth";
import {
  getIngredientDetails,
  updateIngredient,
} from "@/server/ingredients/service";

export async function updateProductAction(
  productId: string,
  previousState: IngredientActionState = initialIngredientActionState,
  formData: FormData,
): Promise<IngredientActionState> {
  void previousState;
  const parsed = parseIngredientFormData(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const { user, workspace } = await requireAuthenticatedContext();
  const existingProduct = await getIngredientDetails(workspace.id, productId);

  if (!existingProduct) {
    return {
      status: "error",
      message: "Produto nao encontrado no workspace atual.",
    };
  }

  const result = await updateIngredient(
    {
      ingredientId: productId,
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
  revalidatePath(`/ingredients/${productId}`);
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);

  return {
    status: "success",
    redirectTo: `/products/${productId}?saved=1`,
    message: result.priceChanged
      ? "Produto e historico de compra atualizados com sucesso."
      : "Produto atualizado e compra atual confirmada.",
  };
}
