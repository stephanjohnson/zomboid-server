-- CreateEnum
CREATE TYPE "StoreOptionDisplayType" AS ENUM ('TEXT', 'COLOR');

-- CreateEnum
CREATE TYPE "StoreOrderStatus" AS ENUM ('PROCESSING', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StoreOrderLineKind" AS ENUM ('VARIANT', 'BUNDLE');

-- CreateTable
CREATE TABLE "store_categories" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "hero_title" TEXT,
    "hero_description" TEXT,
    "accent_color" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_products" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "overview" TEXT,
    "feature_bullets" JSONB,
    "specs" JSONB,
    "badge" TEXT,
    "accent_color" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_product_categories" (
    "product_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "store_product_categories_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "store_product_option_groups" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_type" "StoreOptionDisplayType" NOT NULL DEFAULT 'TEXT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_product_option_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_product_option_values" (
    "id" TEXT NOT NULL,
    "option_group_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color_hex" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_product_option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "item_code" TEXT NOT NULL,
    "game_name" TEXT,
    "game_category" TEXT,
    "price" INTEGER NOT NULL,
    "compare_at_price" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "stock" INTEGER,
    "weight" DECIMAL(10,2),
    "badge" TEXT,
    "image_url" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_product_variant_option_values" (
    "variant_id" TEXT NOT NULL,
    "option_value_id" TEXT NOT NULL,

    CONSTRAINT "store_product_variant_option_values_pkey" PRIMARY KEY ("variant_id","option_value_id")
);

-- CreateTable
CREATE TABLE "store_bundles" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "badge" TEXT,
    "accent_color" TEXT,
    "price" INTEGER NOT NULL,
    "compare_at_price" INTEGER,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_bundle_items" (
    "bundle_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "store_bundle_items_pkey" PRIMARY KEY ("bundle_id","variant_id")
);

-- CreateTable
CREATE TABLE "store_product_recommendations" (
    "source_product_id" TEXT NOT NULL,
    "target_product_id" TEXT NOT NULL,
    "reason" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "store_product_recommendations_pkey" PRIMARY KEY ("source_product_id","target_product_id")
);

-- CreateTable
CREATE TABLE "store_orders" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "player_id" TEXT,
    "status" "StoreOrderStatus" NOT NULL DEFAULT 'PROCESSING',
    "subtotal" INTEGER NOT NULL,
    "discount_total" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "delivered_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_order_lines" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "kind" "StoreOrderLineKind" NOT NULL,
    "product_id" TEXT,
    "variant_id" TEXT,
    "bundle_id" TEXT,
    "title" TEXT NOT NULL,
    "sku" TEXT,
    "item_code" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "compare_at_unit_price" INTEGER,
    "total" INTEGER NOT NULL,
    "snapshot" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_categories_profile_id_is_active_sort_order_idx" ON "store_categories"("profile_id", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "store_categories_profile_id_slug_key" ON "store_categories"("profile_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "store_categories_profile_id_name_key" ON "store_categories"("profile_id", "name");

-- CreateIndex
CREATE INDEX "store_products_profile_id_is_active_is_featured_sort_order_idx" ON "store_products"("profile_id", "is_active", "is_featured", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "store_products_profile_id_slug_key" ON "store_products"("profile_id", "slug");

-- CreateIndex
CREATE INDEX "store_product_categories_category_id_sort_order_idx" ON "store_product_categories"("category_id", "sort_order");

-- CreateIndex
CREATE INDEX "store_product_option_groups_product_id_sort_order_idx" ON "store_product_option_groups"("product_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "store_product_option_groups_product_id_slug_key" ON "store_product_option_groups"("product_id", "slug");

-- CreateIndex
CREATE INDEX "store_product_option_values_option_group_id_sort_order_idx" ON "store_product_option_values"("option_group_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "store_product_option_values_option_group_id_slug_key" ON "store_product_option_values"("option_group_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "store_product_variants_sku_key" ON "store_product_variants"("sku");

-- CreateIndex
CREATE INDEX "store_product_variants_product_id_is_active_sort_order_idx" ON "store_product_variants"("product_id", "is_active", "sort_order");

-- CreateIndex
CREATE INDEX "store_product_variants_item_code_idx" ON "store_product_variants"("item_code");

-- CreateIndex
CREATE INDEX "store_product_variant_option_values_option_value_id_idx" ON "store_product_variant_option_values"("option_value_id");

-- CreateIndex
CREATE INDEX "store_bundles_profile_id_is_active_is_featured_sort_order_idx" ON "store_bundles"("profile_id", "is_active", "is_featured", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "store_bundles_profile_id_slug_key" ON "store_bundles"("profile_id", "slug");

-- CreateIndex
CREATE INDEX "store_bundle_items_variant_id_idx" ON "store_bundle_items"("variant_id");

-- CreateIndex
CREATE INDEX "store_product_recommendations_target_product_id_idx" ON "store_product_recommendations"("target_product_id");

-- CreateIndex
CREATE INDEX "store_orders_profile_id_created_at_idx" ON "store_orders"("profile_id", "created_at");

-- CreateIndex
CREATE INDEX "store_orders_user_id_created_at_idx" ON "store_orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "store_orders_player_id_created_at_idx" ON "store_orders"("player_id", "created_at");

-- CreateIndex
CREATE INDEX "store_order_lines_order_id_sort_order_idx" ON "store_order_lines"("order_id", "sort_order");

-- CreateIndex
CREATE INDEX "store_order_lines_product_id_idx" ON "store_order_lines"("product_id");

-- CreateIndex
CREATE INDEX "store_order_lines_variant_id_idx" ON "store_order_lines"("variant_id");

-- CreateIndex
CREATE INDEX "store_order_lines_bundle_id_idx" ON "store_order_lines"("bundle_id");

-- AddForeignKey
ALTER TABLE "store_categories" ADD CONSTRAINT "store_categories_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_categories" ADD CONSTRAINT "store_product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "store_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_categories" ADD CONSTRAINT "store_product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "store_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_option_groups" ADD CONSTRAINT "store_product_option_groups_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "store_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_option_values" ADD CONSTRAINT "store_product_option_values_option_group_id_fkey" FOREIGN KEY ("option_group_id") REFERENCES "store_product_option_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_variants" ADD CONSTRAINT "store_product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "store_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_variant_option_values" ADD CONSTRAINT "store_product_variant_option_values_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "store_product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_variant_option_values" ADD CONSTRAINT "store_product_variant_option_values_option_value_id_fkey" FOREIGN KEY ("option_value_id") REFERENCES "store_product_option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_bundles" ADD CONSTRAINT "store_bundles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_bundle_items" ADD CONSTRAINT "store_bundle_items_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "store_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_bundle_items" ADD CONSTRAINT "store_bundle_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "store_product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_recommendations" ADD CONSTRAINT "store_product_recommendations_source_product_id_fkey" FOREIGN KEY ("source_product_id") REFERENCES "store_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_recommendations" ADD CONSTRAINT "store_product_recommendations_target_product_id_fkey" FOREIGN KEY ("target_product_id") REFERENCES "store_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "server_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_lines" ADD CONSTRAINT "store_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "store_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_lines" ADD CONSTRAINT "store_order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "store_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_lines" ADD CONSTRAINT "store_order_lines_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "store_product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_lines" ADD CONSTRAINT "store_order_lines_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "store_bundles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
