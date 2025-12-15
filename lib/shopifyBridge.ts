export type ShopifyCartItem = {
  id: number; // Shopify variant ID (numeric)
  quantity: number;
  properties?: Record<string, string>;
};

export function addToShopifyCart(
  items: ShopifyCartItem[],
  opts?: { redirectToCheckout?: boolean; redirectToCart?: boolean; timeoutMs?: number }
) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Not in browser"));
  }

  const requestId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random()}`;

  const targetOrigin = (() => {
    try {
      return document.referrer ? new URL(document.referrer).origin : "*";
    } catch {
      return "*";
    }
  })();

  // FIX: ensure a preview URL is always passed via line item properties (derived from nf_art_id)
  const itemsWithPreview: ShopifyCartItem[] = items.map((item) => {
    const props: Record<string, string> = { ...(item.properties ?? {}) };

    if (!props.nf_preview_url) {
      const artId = props.nf_art_id;
      if (artId) {
        props.nf_preview_url = `${window.location.origin}/api/generated-art/${artId}/preview`;
      }
    }

    return { ...item, properties: props };
  });

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Shopify cart bridge timed out"));
    }, opts?.timeoutMs ?? 8000);

    const onMessage = (event: MessageEvent) => {
      const data: any = event.data;
      if (!data || data.type !== "NF_ADD_TO_CART_RESULT") return;
      if (data.requestId !== requestId) return;

      cleanup();
      if (data.ok) resolve();
      else reject(new Error(data.error || "Failed to add to cart"));
    };

    function cleanup() {
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
    }

    window.addEventListener("message", onMessage);

    window.parent?.postMessage(
      {
        type: "NF_ADD_TO_CART",
        requestId,
        items: itemsWithPreview,
        redirectToCheckout: !!opts?.redirectToCheckout,
        redirectToCart: !!opts?.redirectToCart,
      },
      targetOrigin
    );
  });
}