"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCart } from "@/components/cart/CartProvider";
import { useRouter } from "next/navigation";

type ShippingFormState = {
  email: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
};

export function CheckoutForm({ clientSecret, orderId }: { clientSecret: string; orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items, totalCents, clearCart } = useCart();
  const [shipping, setShipping] = useState<ShippingFormState>({
    email: "",
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "GB",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If no items or no clientSecret, send back to cart
    useEffect(() => {
    if (!clientSecret) {
      router.push("/cart");
    }
  }, [clientSecret, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!stripe || !elements) {
      setErrorMsg("Payment is not ready yet. Please wait a moment.");
      return;
    }

    setSubmitting(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/${orderId}`,
      },
      redirect: "if_required",
    });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message ?? "Something went wrong confirming payment.");
      return;
    }

    // For now assume success if no error and no redirect
    clearCart();
    router.push(`/order/${orderId}`);
  };

  const totalDisplay = `£${(totalCents / 100).toFixed(2)}`;

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-[1.1fr,0.9fr]">
      {/* Left - Shipping + Payment */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-nf-border p-4 space-y-4">
          <h2 className="text-sm font-medium text-nf-ink">
            Shipping details
          </h2>

          {["email", "name", "addressLine1", "addressLine2", "city", "postcode"].map(field => (
            <div key={field}>
              <label className="block text-xs mb-1 text-nf-text">
                {field === "addressLine1"
                  ? "Address line 1"
                  : field === "addressLine2"
                  ? "Address line 2 (optional)"
                  : field === "postcode"
                  ? "Postcode"
                  : field === "name"
                  ? "Full name"
                  : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                required={field !== "addressLine2"}
                value={(shipping as any)[field]}
                onChange={e =>
                  setShipping(prev => ({ ...prev, [field]: e.target.value }))
                }
                className="w-full border border-nf-border rounded-md px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-nf-border p-4 space-y-4">
          <h2 className="text-sm font-medium text-nf-ink">
            Payment
          </h2>
          <PaymentElement />
        </div>

        {errorMsg && (
          <p className="text-sm text-nf-error">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !stripe || !elements}
          className="inline-flex items-center justify-center rounded-md bg-nf-primary text-white px-6 py-2 text-sm font-medium disabled:opacity-60"
        >
          {submitting ? "Processing..." : `Pay ${totalDisplay}`}
        </button>
      </div>

      {/* Right - Order summary */}
      <div className="bg-white rounded-xl border border-nf-border p-4 space-y-4">
        <h2 className="text-sm font-medium text-nf-ink">
          Order summary
        </h2>
        <div className="space-y-3 max-h-64 overflow-auto pr-1">
          {items.map(item => (
            <div key={item.id} className="flex gap-3">
              <div className="w-14 h-18 bg-nf-grey100 rounded-md overflow-hidden flex items-center justify-center">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-nf-text-muted">
                    No preview
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-heading text-nf-ink">
                  {item.productTitle}
                </p>
                <p className="text-[11px] text-nf-text-muted">
                  {item.sizeLabel} · {item.format}
                  {item.frameColor ? ` · ${item.frameColor} frame` : ""}
                </p>
                <p className="text-[11px] text-nf-text-muted mt-1">
                  £{(item.unitPriceCents / 100).toFixed(2)} × {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-nf-border">
          <p className="text-sm text-nf-text-muted">Total</p>
          <p className="text-lg font-semibold text-nf-ink">{totalDisplay}</p>
        </div>
      </div>
    </form>
  );
}