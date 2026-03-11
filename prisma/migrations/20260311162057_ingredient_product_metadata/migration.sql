-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "purchaseLocation" TEXT;

-- AlterTable
ALTER TABLE "IngredientPriceHistory" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "purchaseLocation" TEXT;
