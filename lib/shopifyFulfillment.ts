// lib/shopifyFulfillment.ts

type TrackingInfo = {
  number: string;
  company?: string | null;
  url?: string | null;
};

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function normaliseShopDomain(input: string): string {
  // Accept "nestframe.myshopify.com" or "nestframe"
  if (input.includes(".")) return input;
  return `${input}.myshopify.com`;
}

const SHOP_DOMAIN = normaliseShopDomain(required("SHOPIFY_STORE_DOMAIN"));
const SHOP_TOKEN = required("SHOPIFY_ADMIN_ACCESS_TOKEN");
const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2025-10";

async function shopifyFetch(path: string, init?: RequestInit) {
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/${API_VERSION}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOP_TOKEN,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {
    // leave as text
  }

  return { res, data };
}

export async function createShopifyFulfillmentForOrder(input: {
  shopifyOrderId: number;
  tracking: TrackingInfo;
  notifyCustomer?: boolean;
}) {
  // 1) Find fulfillment orders for this order
  const { res: foRes, data: foJson } = await shopifyFetch(
    `/orders/${input.shopifyOrderId}/fulfillment_orders.json`,
    { method: "GET" }
  );

  if (!foRes.ok) {
    throw new Error(
      `Shopify fulfillment_orders lookup failed (${foRes.status}): ${
        typeof foJson === "string" ? foJson : JSON.stringify(foJson)
      }`
    );
  }

  const fulfillmentOrders: any[] = Array.isArray(foJson?.fulfillment_orders)
    ? foJson.fulfillment_orders
    : [];

  // Usually there is 1 open fulfillment order for your case
  const open = fulfillmentOrders.filter((f) =>
    String(f?.status || "").toLowerCase().includes("open")
  );

  if (open.length === 0) {
    // Already fulfilled or no shippable items
    return { ok: true, skipped: true, reason: "no_open_fulfillment_orders" as const };
  }

  // 2) Create a fulfillment with tracking
  const notify_customer = input.notifyCustomer ?? true;

  // Create one fulfillment per open fulfillment order
  const results: any[] = [];
  for (const fo of open) {
    const payload = {
      fulfillment: {
        notify_customer,
        tracking_info: {
          number: input.tracking.number,
          company: input.tracking.company ?? undefined,
          url: input.tracking.url ?? undefined,
        },
        line_items_by_fulfillment_order: [
          {
            fulfillment_order_id: fo.id,
          },
        ],
      },
    };

    const { res: fRes, data: fJson } = await shopifyFetch(`/fulfillments.json`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (fRes.ok) {
      results.push({ ok: true, fulfillment_order_id: fo.id, response: fJson });
      continue;
    }

    const msg = typeof fJson === "string" ? fJson : JSON.stringify(fJson);

    // Idempotency: if Shopify says it is already fulfilled, treat as success
    if (/already.*fulfilled/i.test(msg) || /has already been fulfilled/i.test(msg)) {
      results.push({ ok: true, skipped: true, fulfillment_order_id: fo.id, reason: "already_fulfilled" });
      continue;
    }

    throw new Error(`Shopify fulfillment create failed (${fRes.status}): ${msg}`);
  }

  return { ok: true, results };
}