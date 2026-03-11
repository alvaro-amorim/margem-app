-- CreateEnum
CREATE TYPE "WorkspaceMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "BaseUnit" AS ENUM ('GRAM', 'MILLILITER', 'UNIT');

-- CreateEnum
CREATE TYPE "PurchaseUnit" AS ENUM ('GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'UNIT', 'DOZEN', 'PACK', 'BOX', 'BOTTLE', 'CAN', 'BAG', 'JAR', 'POT', 'TRAY', 'SACK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "defaultWorkspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceMemberRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "purchaseUnit" "PurchaseUnit" NOT NULL,
    "baseUnit" "BaseUnit" NOT NULL,
    "purchaseQuantity" DECIMAL(12,3) NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "conversionFactor" DECIMAL(12,4) NOT NULL,
    "unitCostInBaseUnit" DECIMAL(14,6) NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPriceConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientPriceHistory" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "recordedById" TEXT,
    "purchaseQuantity" DECIMAL(12,3) NOT NULL,
    "purchaseUnit" "PurchaseUnit" NOT NULL,
    "baseUnit" "BaseUnit" NOT NULL,
    "conversionFactor" DECIMAL(12,4) NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "unitCostInBaseUnit" DECIMAL(14,6) NOT NULL,
    "priceChanged" BOOLEAN NOT NULL DEFAULT true,
    "changeNote" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngredientPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "yieldQuantity" DECIMAL(12,3) NOT NULL,
    "yieldUnitLabel" TEXT NOT NULL,
    "servingQuantity" DECIMAL(12,3) NOT NULL,
    "servingUnitLabel" TEXT NOT NULL,
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantityInBaseUnit" DECIMAL(12,3) NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingSettings" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "wastePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "packagingCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "energyCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fixedOverheadCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "targetMarginPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "includePackaging" BOOLEAN NOT NULL DEFAULT false,
    "includeLabor" BOOLEAN NOT NULL DEFAULT false,
    "includeEnergy" BOOLEAN NOT NULL DEFAULT false,
    "includeFixedOverhead" BOOLEAN NOT NULL DEFAULT false,
    "includeCommission" BOOLEAN NOT NULL DEFAULT false,
    "includeTax" BOOLEAN NOT NULL DEFAULT false,
    "includeTargetMargin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipePricingProfile" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "includeIngredients" BOOLEAN NOT NULL DEFAULT true,
    "includeWaste" BOOLEAN NOT NULL DEFAULT true,
    "wastePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "includePackaging" BOOLEAN NOT NULL DEFAULT false,
    "packagingCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "includeLabor" BOOLEAN NOT NULL DEFAULT false,
    "laborCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "includeEnergy" BOOLEAN NOT NULL DEFAULT false,
    "energyCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "includeFixedOverhead" BOOLEAN NOT NULL DEFAULT false,
    "fixedOverheadCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "includeCommission" BOOLEAN NOT NULL DEFAULT false,
    "commissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "includeTax" BOOLEAN NOT NULL DEFAULT false,
    "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "includeTargetMargin" BOOLEAN NOT NULL DEFAULT true,
    "targetMarginPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipePricingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdById" TEXT,
    "snapshotVersion" INTEGER NOT NULL DEFAULT 1,
    "recipeName" TEXT NOT NULL,
    "yieldQuantity" DECIMAL(12,3) NOT NULL,
    "yieldUnitLabel" TEXT NOT NULL,
    "servingQuantity" DECIMAL(12,3) NOT NULL,
    "servingUnitLabel" TEXT NOT NULL,
    "ingredientCostTotal" DECIMAL(12,2) NOT NULL,
    "additionalCostTotal" DECIMAL(12,2) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "costPerServing" DECIMAL(12,2) NOT NULL,
    "breakEvenPrice" DECIMAL(12,2) NOT NULL,
    "suggestedPrice" DECIMAL(12,2) NOT NULL,
    "targetMarginPercent" DECIMAL(5,2) NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "resultSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "Ingredient_workspaceId_category_idx" ON "Ingredient"("workspaceId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_workspaceId_name_key" ON "Ingredient"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "IngredientPriceHistory_ingredientId_effectiveDate_idx" ON "IngredientPriceHistory"("ingredientId", "effectiveDate");

-- CreateIndex
CREATE INDEX "IngredientPriceHistory_workspaceId_effectiveDate_idx" ON "IngredientPriceHistory"("workspaceId", "effectiveDate");

-- CreateIndex
CREATE INDEX "Recipe_workspaceId_isArchived_idx" ON "Recipe"("workspaceId", "isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_workspaceId_name_key" ON "Recipe"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "RecipeItem_recipeId_sortOrder_idx" ON "RecipeItem"("recipeId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeItem_recipeId_ingredientId_key" ON "RecipeItem"("recipeId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingSettings_workspaceId_key" ON "PricingSettings"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipePricingProfile_recipeId_key" ON "RecipePricingProfile"("recipeId");

-- CreateIndex
CREATE INDEX "RecipePricingProfile_workspaceId_idx" ON "RecipePricingProfile"("workspaceId");

-- CreateIndex
CREATE INDEX "PricingRun_workspaceId_createdAt_idx" ON "PricingRun"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "PricingRun_recipeId_createdAt_idx" ON "PricingRun"("recipeId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultWorkspaceId_fkey" FOREIGN KEY ("defaultWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientPriceHistory" ADD CONSTRAINT "IngredientPriceHistory_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientPriceHistory" ADD CONSTRAINT "IngredientPriceHistory_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientPriceHistory" ADD CONSTRAINT "IngredientPriceHistory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingSettings" ADD CONSTRAINT "PricingSettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipePricingProfile" ADD CONSTRAINT "RecipePricingProfile_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipePricingProfile" ADD CONSTRAINT "RecipePricingProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRun" ADD CONSTRAINT "PricingRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRun" ADD CONSTRAINT "PricingRun_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRun" ADD CONSTRAINT "PricingRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
