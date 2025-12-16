// lib/printfulWallArt.ts
import "server-only";

const PRINTFUL_V2 = "https://api.printful.com/v2";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing`);
  return v;
}

const API_KEY = required("PRINTFUL_API_KEY");
const STORE_ID = required("PRINTFUL_STORE_ID");

export type PFRecipient = {
  name: string;
  address1: string;
  city: string;
  country_code: string;
  zip: string;
  state_code?: string;
  phone?: string;
  email?: string;
};

export type PFV2Layer = { type: "file"; url: string };
export type PFV2Placement = {
  placement: "default";
  technique: "digital";
  layers: PFV2Layer[];
};

export type PFV2OrderItem = {
  source: "catalog";
  catalog_variant_id: number;
  quantity: number;
  placements: PFV2Placement[];
};

export type PFV2OrderCreate = {
  external_id: string;
  recipient: PFRecipient;
  order_items: PFV2OrderItem[];
};

async function pfFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${PRINTFUL_V2}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "X-PF-Store-Id": STORE_ID,
      ...(init.headers ?? {}),
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

  if (!res.ok) {
    throw new Error(
      `Printful ${res.status} ${res.statusText}: ${typeof data === "string" ? data : JSON.stringify(data)}`
    );
  }

  return (data?.data ?? data) as T;
}

export async function getOrderByExternalId(externalId: string) {
  // v2 supports filtering by external_id
  const q = `?external_id=${encodeURIComponent(externalId)}`;
  const data = await pfFetch<{ items?: any[] }>(`/orders${q}`, { method: "GET" });
  return Array.isArray(data?.items) && data.items.length > 0 ? data.items[0] : null;
}

export async function createDraftOrderV2(body: PFV2OrderCreate) {
  // Creates order in Printful (draft/created depending on your Printful settings)
  const created = await pfFetch<{ id: number }>(`/orders`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return created;
}