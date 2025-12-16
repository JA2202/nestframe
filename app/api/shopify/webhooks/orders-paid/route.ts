// app/api/shopify/webhooks/orders-paid/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createDraftOrderV2, getOrderByExternalId, type PFV2OrderItem } from "@/lib/printfulWallArt";
import { getPrintfulCatalogVariantId } from "@/lib/printfulVariantMap";

export const runtime = "nodejs";

function verifyShopifyHmac(rawBody: string, hmacHeader: string | null, secret: string) {
  if (!hmacHeader) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function propsArrayToObject(props: any): Record<string, string> {
  // Shopify line_item.properties is usually: [{ name, value }, ...]
  if (!Array.isArray(props)) return {};
  const out: Record<string, string> = {};
  for (const p of props) {
    const name = p?.name;
    const value = p?.value;
    if (typeof name === "string" && value != null) out[name] = String(value);
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Missing SHOPIFY_WEBHOOK_SECRET" }, { status: 500 });
    }

    const rawBody = await req.text();
    const hmac = req.headers.get("x-shopify-hmac-sha256");

    if (!verifyShopifyHmac(rawBody, hmac, secret)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const order = JSON.parse(rawBody) as any;

    const externalId = `shopify_${order?.id ?? order?.name ?? Date.now()}`;

    // Idempotency: if we already created a Printful order for this external id, do nothing.
    const existing = await getOrderByExternalId(externalId).catch(() => null);
    if (existing) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    const shipping = order?.shipping_address;
    if (!shipping) {
      return NextResponse.json({ error: "Order missing shipping_address" }, { status: 400 });
    }

    const recipient = {
      name: `${shipping.first_name ?? ""} ${shipping.last_name ?? ""}`.trim(),
      address1: shipping.address1,
      city: shipping.city,
      country_code: shipping.country_code,
      zip: shipping.zip,
      state_code: shipping.province_code ?? undefined,
      phone: order?.phone ?? shipping.phone ?? undefined,
      email: order?.email ?? undefined,
    };

    const lineItems: any[] = Array.isArray(order?.line_items) ? order.line_items : [];
    const nfItems = lineItems
      .map((li) => ({ li, props: propsArrayToObject(li?.properties) }))
      .filter(({ props }) => !!props.nf_art_id && !!props.nf_print_type && !!props.nf_size);

    if (nfItems.length === 0) {
      return NextResponse.json({ ok: true, note: "No nestframe items in order" }, { status: 200 });
    }

    const order_items: PFV2OrderItem[] = [];

    for (const { li, props } of nfItems) {
      const artId = props.nf_art_id;
      const printType = props.nf_print_type; // "FRAMED_PRINT" | "PRINT_ONLY" | "CANVAS"
      const size = props.nf_size; // e.g. "18x24"
      const frameColour = props.nf_frame_colour ?? null;

      const catalogVariantId = getPrintfulCatalogVariantId({
        printType: printType as any,
        size,
        frameColour,
      });

      if (!catalogVariantId) {
        throw new Error(
          `Missing Printful catalog variant mapping for ${printType} ${size} ${frameColour ?? ""}`
        );
      }

      // Build print file and upload to Blob (public URL)
      const res = await fetch(
        `${process.env.NF_PUBLIC_APP_ORIGIN ?? ""}/api/generated-art/${artId}/print-file`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ size, printType, frameColour }),
        }
      );

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? `Failed to build print file for ${artId}`);
      }

      const j = await res.json();
      const printFileUrl = j?.url;
      if (!printFileUrl) throw new Error("Print file route did not return a url");

      order_items.push({
        source: "catalog",
        catalog_variant_id: catalogVariantId,
        quantity: Number(li?.quantity ?? 1),
        placements: [
          {
            placement: "default",
            technique: "digital",
            layers: [{ type: "file", url: printFileUrl }],
          },
        ],
      });
    }

    const created = await createDraftOrderV2({
      external_id: externalId,
      recipient,
      order_items,
    });

    return NextResponse.json({ ok: true, printfulOrder: created }, { status: 200 });
  } catch (err) {
    console.error(err);

    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("External ID validation error") ||
      msg.includes("external_id must be unique") ||
      msg.includes("already used")
    ) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}