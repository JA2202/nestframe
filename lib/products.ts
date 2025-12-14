// lib/products.ts
import { supabaseAdmin } from "./supabaseClient";

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  format: string;
  size_label: string;
  frame_color: string | null;
  base_price_cents: number;
  is_default: boolean;
};

export type ProductWithDefaultVariant = Product & {
  defaultVariant: ProductVariant | null;
};

export async function getPublicProductsWithDefaultVariant(): Promise<ProductWithDefaultVariant[]> {
  const supabase = supabaseAdmin();

  // 1) Get public products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("is_public", true);

  if (productsError || !products) {
    console.error(productsError);
    return [];
  }

  const productIds = products.map(p => p.id);

  if (productIds.length === 0) return [];

  // 2) Get default variants for those products
  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("*")
    .in("product_id", productIds)
    .eq("is_default", true);

  if (variantsError || !variants) {
    console.error(variantsError);
    return products.map(p => ({ ...p, defaultVariant: null }));
  }

  // 3) Attach the matching default variant to each product
  return products.map(p => ({
    ...p,
    defaultVariant: variants.find(v => v.product_id === p.id) ?? null,
  }));
}

// lib/products.ts (add below existing code)

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

export async function getProductBySlugWithVariants(
  slug: string
): Promise<ProductWithVariants | null> {
  const supabase = supabaseAdmin();

  // 1) Get the product
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .limit(1);

  if (productError || !products || products.length === 0) {
    console.error(productError);
    return null;
  }

  const product = products[0];

  // 2) Get all variants for this product
  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id);

  if (variantsError || !variants) {
    console.error(variantsError);
    return { ...product, variants: [] };
  }

  return { ...product, variants };

}

export async function getCustomDefaultVariant() {
  const supabase = supabaseAdmin();

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("slug", "custom-wall-art")
    .limit(1);

  if (productError || !products || products.length === 0) {
    console.error(productError);
    return null;
  }

  const product = products[0];

  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_default", true)
    .limit(1);

  if (variantError || !variants || variants.length === 0) {
    console.error(variantError);
    return null;
  }

  return {
    product,
    variant: variants[0],
  };
}
