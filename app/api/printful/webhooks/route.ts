// app/api/printful/webhooks/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createShopifyFulfillmentForOrder } from "@/lib/shopifyFulfillment";

export const runtime = "nodejs";

function timingSafeEqualUtf8(a: string, b: string) {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function verifyPrintfulSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;

  // Common patterns: raw hex, base64, or "sha256=<hex>"
  const incoming = signatureHeader.replace(/^sha256=/i, "").trim();

  const hmacHex = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const hmacBase64 = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

  return timingSafeEqualUtf8(incoming, hmacHex) || timingSafeEqualUtf8(incoming, hmacBase64);
}

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

function extractTracking(
  payload: any
): { number: string; company?: string | null; url?: string | null } | null {
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

    const urlObj = new URL(req.url);
    const token = urlObj.searchParams.get("token");
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.PRINTFUL_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Missing PRINTFUL_WEBHOOK_SECRET" }, { status: 500 });
    }

    const rawBody = await req.text();

    const sig =
      req.headers.get("x-pf-signature") ??
      req.headers.get("x-printful-signature") ??
      req.headers.get("x-webhook-signature");

    if (!verifyPrintfulSignature(rawBody, sig, secret)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const payload = (() => {
      try {
        return JSON.parse(rawBody);
      } catch {
        return {};
      }
    })();

    const externalId = extractExternalId(payload);
    if (!externalId) {
      // Not an order we can map
      return NextResponse.json(
        { ok: true, skipped: true, reason: "no_external_id" },
        { status: 200 }
      );
    }

    const shopifyOrderId = externalIdToShopifyOrderId(externalId);
    if (!shopifyOrderId) {
      return NextResponse.json(
        { ok: true, skipped: true, reason: "external_id_not_shopify" },
        { status: 200 }
      );
    }

    const tracking = extractTracking(payload);
    if (!tracking) {
      // Many Printful events do not include tracking yet. Ignore until shipped.
      return NextResponse.json(
        { ok: true, skipped: true, reason: "no_tracking_yet" },
        { status: 200 }
      );
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