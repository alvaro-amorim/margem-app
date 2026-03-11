"use server";

import { revalidatePath } from "next/cache";

import {
  initialPricingActionState,
  parsePricingFormData,
  type PricingActionState,
} from "@/features/pricing/schema";
import { requireAuthenticatedContext } from "@/lib/auth";
import { createPricingRun } from "@/server/recipes/service";

export async function savePricingRunAction(
  previousState: PricingActionState = initialPricingActionState,
  formData: FormData,
): Promise<PricingActionState> {
  void previousState;
  const parsed = parsePricingFormData(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const { user, workspace } = await requireAuthenticatedContext();
  const result = await createPricingRun(parsed.data, {
    workspaceId: workspace.id,
    userId: user.id,
  });

  if (!result.success) {
    return {
      status: "error",
      message: result.message,
    };
  }

  revalidatePath("/pricing");
  revalidatePath(`/recipes/${result.recipeId}`);

  const query = new URLSearchParams({
    recipeId: result.recipeId,
    runId: result.runId,
    saved: "1",
  });

  return {
    status: "success",
    redirectTo: `/pricing?${query.toString()}`,
    message: "Simulacao salva com sucesso.",
  };
}
