import { createIngredientAction } from "@/app/(app)/ingredients/actions";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { BaseUnit, PurchaseUnit } from "@/generated/prisma/enums";
import { requireAuthenticatedContext } from "@/lib/auth";
import { listWorkspaceIngredientCategories } from "@/server/ingredients/service";

const initialValues = {
  name: "",
  category: "",
  brand: "",
  purchaseLocation: "",
  purchaseUnit: PurchaseUnit.KILOGRAM,
  baseUnit: BaseUnit.GRAM,
  purchaseQuantity: "1",
  purchasePrice: "",
  conversionFactor: "1000",
  notes: "",
  priceDecision: "changed" as const,
};

type NewIngredientPageProps = {
  searchParams: Promise<{
    created?: string;
  }>;
};

export default async function NewIngredientPage({
  searchParams,
}: NewIngredientPageProps) {
  const [query, authContext] = await Promise.all([
    searchParams,
    requireAuthenticatedContext(),
  ]);
  const categorySuggestions = await listWorkspaceIngredientCategories(authContext.workspace.id);
  const showCreatedBanner = query.created === "1";

  return (
    <div className="space-y-6">
      {showCreatedBanner ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Produto cadastrado com sucesso. O formulario foi limpo para voce continuar cadastrando.
        </div>
      ) : null}

      <IngredientForm
        mode="create"
        title="Novo ingrediente"
        description="Cadastre o produto com categoria padronizada, marca, local da compra, forma de compra e conversao para sustentar os calculos."
        submitLabel="Salvar ingrediente"
        cancelHref="/ingredients"
        action={createIngredientAction}
        initialValues={initialValues}
        categorySuggestions={categorySuggestions}
      />
    </div>
  );
}
