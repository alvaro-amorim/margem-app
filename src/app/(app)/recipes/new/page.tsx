import { createRecipeAction } from "@/app/(app)/recipes/actions";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { requireAuthenticatedContext } from "@/lib/auth";
import { listRecipeIngredientOptions } from "@/server/recipes/service";

export default async function NewRecipePage() {
  const authContext = await requireAuthenticatedContext();
  const ingredients = await listRecipeIngredientOptions(authContext.workspace.id);

  return (
    <RecipeForm
      mode="create"
      title="Nova receita"
      description="Cadastre rendimento, porção vendida e ingredientes para manter a ficha técnica da receita centralizada."
      submitLabel="Salvar receita"
      cancelHref="/recipes"
      action={createRecipeAction}
      availableIngredients={ingredients.map((ingredient) => ({
        ...ingredient,
        unitCostInBaseUnit: Number(ingredient.unitCostInBaseUnit),
      }))}
      initialValues={{
        name: "",
        description: "",
        yieldQuantity: "",
        yieldUnitLabel: "",
        servingQuantity: "1",
        servingUnitLabel: "",
        notes: "",
        items: [
          {
            id: "item-1",
            ingredientId: "",
            quantityInBaseUnit: "",
            notes: "",
          },
        ],
      }}
    />
  );
}
