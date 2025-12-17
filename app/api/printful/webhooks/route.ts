// app/api/printful/webhooks/route.ts
import { NextResponse } from "next/server";
import { createShopifyFulfillmentForOrder } from "@/lib/shopifyFulfillment";

export const runtime = "nodejs";

function pickFirstString(...vals: any[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function extractExternalId(payload: any): string | null {
  return pickFirstString(
    payload?.data?.order?.external_id,
    payload?.data?.order?.externalId,
    payload?.data?.external_id,
    payload?.data?.externalId,
    payload?.order?.external_id,
    payload?.order?.externalId,
    payload?.external_id,
    payload?.externalId
  );
}

function externalIdToShopifyOrderId(externalId: string): number | null {
  // Expected: "shopify_12746358718845"
  const m = externalId.match(/shopify_(\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function extractTracking(payload: any): { number: string; company?: string | null; url?: string | null } | null {
  const trackingNumber = pickFirstString(
    payload?.data?.shipment?.tracking_number,
    payload?.data?.shipment?.trackingNumber,
    payload?.data?.tracking_number,
    payload?.data?.trackingNumber,
    payload?.shipment?.tracking_number,
    payload?.shipment?.trackingNumber,
    payload?.tracking_number,
    payload?.trackingNumber,
    payload?.data?.shipments?.[0]?.tracking_number,
    payload?.data?.shipments?.[0]?.trackingNumber
  );

  if (!trackingNumber) return null;

  const company = pickFirstString(
    payload?.data?.shipment?.carrier,
    payload?.data?.shipment?.carrier_name,
    payload?.data?.shipment?.tracking_company,
    payload?.data?.carrier,
    payload?.data?.carrier_name,
    payload?.data?.tracking_company
  );

  const url = pickFirstString(
    payload?.data?.shipment?.tracking_url,
    payload?.data?.shipment?.trackingUrl,
    payload?.data?.tracking_url,
    payload?.data?.trackingUrl
  );

  return { number: trackingNumber, company, url };
}

export async function POST(req: Request) {
  try {
    const expectedToken = process.env.PRINTFUL_WEBHOOK_TOKEN;
    if (!expectedToken) {
      return NextResponse.json({ error: "Missing PRINTFUL_WEBHOOK_TOKEN" }, { status: 500 });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));

    const externalId = extractExternalId(payload);
    if (!externalId) {
      // Not an order we can map
      return NextResponse.json({ ok: true, skipped: true, reason: "no_external_id" }, { status: 200 });
    }

    const shopifyOrderId = externalIdToShopifyOrderId(externalId);
    if (!shopifyOrderId) {
      return NextResponse.json({ ok: true, skipped: true, reason: "external_id_not_shopify" }, { status: 200 });
    }

    const tracking = extractTracking(payload);
    if (!tracking) {
      // Many Printful events do not include tracking yet. Ignore until shipped.
      return NextResponse.json({ ok: true, skipped: true, reason: "no_tracking_yet" }, { status: 200 });
    }

    const result = await createShopifyFulfillmentForOrder({
      shopifyOrderId,
      tracking,
      notifyCustomer: true,
    });

    return NextResponse.json({ ok: true, shopify: result }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Printful webhook failed" },
      { status: 500 }
    );
  }
}