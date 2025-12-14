// lib/orders.ts
import { supabaseAdmin } from "./supabaseClient";

type CartItemInput = {
  productVariantId: string;
  quantity: number;
};

type ShippingInput = {
  email: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country: string; // use "GB" for now
};

export async function createOrderFromCart(
  items: CartItemInput[],
  shipping: ShippingInput,
  userId?: string | null
) {
  const supabase = supabaseAdmin();

  // 1 - Fetch variants to validate prices and compute total
  const variantIds = items.map(i => i.productVariantId);

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, base_price_cents, currency, product_id")
    .in("id", variantIds);

  if (variantsError || !variants || variants.length === 0) {
    throw new Error("Could not load variants for order");
  }

  // Simple look up map
  const variantMap = new Map(
    variants.map(v => [v.id, v])
  );

  let totalCents = 0;

  const orderItemsToInsert = items.map(item => {
    const variant = variantMap.get(item.productVariantId);
    if (!variant) {
      throw new Error("Variant not found for order item");
    }
    const unitPrice = variant.base_price_cents;
    const lineTotal = unitPrice * item.quantity;
    totalCents += lineTotal;

    return {
      product_variant_id: item.productVariantId,
      generated_art_id: null, // later for custom art
      quantity: item.quantity,
      unit_price_cents: unitPrice,
      line_total_cents: lineTotal,
      title_snapshot: null,
      options_snapshot: {},
    };
  });

  // 2 - Create order
  const { data: orderInsert, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId ?? null,
      email: shipping.email,
      status: "pending",
      total_cents: totalCents,
      currency: "GBP",
      shipping_name: shipping.name,
      shipping_address_line1: shipping.addressLine1,
      shipping_address_line2: shipping.addressLine2 ?? null,
      shipping_city: shipping.city,
      shipping_postcode: shipping.postcode,
      shipping_country: shipping.country,
    })
    .select("id")
    .single();

  if (orderError || !orderInsert) {
    throw new Error("Could not create order");
  }

  const orderId = orderInsert.id as string;

  // 3 - Insert order items
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(
      orderItemsToInsert.map(oi => ({
        ...oi,
        order_id: orderId,
      }))
    );

  if (itemsError) {
    throw new Error("Could not create order items");
  }

  return { orderId, totalCents };
}