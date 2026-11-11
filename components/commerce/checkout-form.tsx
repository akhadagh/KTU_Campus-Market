"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPesewas } from "@/lib/money";

export interface CheckoutLine {
  productName: string;
  vendorName: string;
  quantity: number;
  lineTotalPesewas: number;
}

export function CheckoutForm({
  lines,
  subtotalPesewas,
  pickupLocations,
  deliveryFeePesewas,
}: {
  lines: CheckoutLine[];
  subtotalPesewas: number;
  pickupLocations: { id: string; name: string; address: string }[];
  deliveryFeePesewas: number;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<"PICKUP" | "CAMPUS_DELIVERY" | "COURIER">("PICKUP");
  const [pickupLocationId, setPickupLocationId] = useState(pickupLocations[0]?.id ?? "");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (method !== "PICKUP" && (!fullName.trim() || !phone.trim() || !address.trim())) {
      setError("Enter the recipient name, phone number, and delivery address.");
      return;
    }
    if (method === "PICKUP" && !pickupLocationId) {
      setError("Choose a pickup point.");
      return;
    }

    setPending(true);
    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const orderRes = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod: method,
          pickupLocationId: method === "PICKUP" ? pickupLocationId : undefined,
          deliveryAddress:
            method === "PICKUP"
              ? undefined
              : {
                  fullName: fullName.trim(),
                  phone: phone.trim(),
                  address: address.trim(),
                  instructions: instructions.trim() || undefined,
                },
          notes: notes.trim() || undefined,
          idempotencyKey,
        }),
      });
      const orderJson = (await orderRes.json()) as {
        data?: { order?: { id: string; orderNumber: string } };
        error?: { message?: string };
      };
      if (!orderRes.ok || !orderJson.data?.order) {
        setError(orderJson.error?.message ?? "Could not place the order.");
        setPending(false);
        return;
      }
      const order = orderJson.data.order;

      const payRes = await fetch("/api/v1/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const payJson = (await payRes.json()) as {
        data?: { authorizationUrl?: string };
        error?: { message?: string; code?: string };
      };

      if (payRes.ok && payJson.data?.authorizationUrl) {
        window.location.href = payJson.data.authorizationUrl;
        return;
      }

      toast.success(`Order ${order.orderNumber} placed`, {
        description:
          payJson.error?.code === "PROVIDER_UNAVAILABLE"
            ? "Online payments are not configured on this deployment, so the order is awaiting payment."
            : "Payment could not start. Open the order to retry.",
      });
      router.push(`/orders/${order.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      noValidate
      className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]"
    >
      <div className="space-y-5">
        <fieldset className="rounded-xl border border-neutral-200 bg-white p-5">
          <legend className="px-1 text-sm font-semibold text-neutral-900">Delivery method</legend>
          <div className="mt-3 space-y-3">
            {[
              {
                value: "PICKUP",
                label: "Campus pickup",
                hint: "Collect from the seller's pickup point.",
              },
              {
                value: "CAMPUS_DELIVERY",
                label: "Campus delivery",
                hint: `Seller delivers on campus (${formatPesewas(deliveryFeePesewas)} per seller).`,
              },
              {
                value: "COURIER",
                label: "Courier",
                hint: `Third-party courier to your address (${formatPesewas(deliveryFeePesewas * 3)} per seller).`,
              },
            ].map((option) => (
              <label key={option.value} className="flex items-start gap-3 text-sm">
                <input
                  type="radio"
                  name="delivery-method"
                  value={option.value}
                  checked={method === option.value}
                  onChange={() => setMethod(option.value as typeof method)}
                  className="accent-brand-700 mt-0.5 h-4 w-4"
                />
                <span>
                  <span className="font-medium text-neutral-900">{option.label}</span>
                  <span className="block text-xs text-neutral-600">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {method === "PICKUP" ? (
          <fieldset className="rounded-xl border border-neutral-200 bg-white p-5">
            <legend className="px-1 text-sm font-semibold text-neutral-900">Pickup point</legend>
            {pickupLocations.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-600">
                No pickup points are configured yet. Ask the seller where to collect.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {pickupLocations.map((location) => (
                  <label key={location.id} className="flex items-start gap-3 text-sm">
                    <input
                      type="radio"
                      name="pickup-location"
                      value={location.id}
                      checked={pickupLocationId === location.id}
                      onChange={() => setPickupLocationId(location.id)}
                      className="accent-brand-700 mt-0.5 h-4 w-4"
                    />
                    <span>
                      <span className="font-medium text-neutral-900">{location.name}</span>
                      <span className="block text-xs text-neutral-600">{location.address}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        ) : (
          <fieldset className="rounded-xl border border-neutral-200 bg-white p-5">
            <legend className="px-1 text-sm font-semibold text-neutral-900">
              Delivery address
            </legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <FormField label="Recipient name" htmlFor="checkout-name" required>
                <Input
                  id="checkout-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                />
              </FormField>
              <FormField label="Phone" htmlFor="checkout-phone" required>
                <Input
                  id="checkout-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="Address" htmlFor="checkout-address" required>
                <Input
                  id="checkout-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="e.g. Hostel block B, room 12"
                  autoComplete="street-address"
                />
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="Delivery notes" htmlFor="checkout-instructions">
                <Textarea
                  id="checkout-instructions"
                  className="min-h-20"
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Gate, landmark, or contact instructions"
                />
              </FormField>
            </div>
          </fieldset>
        )}

        <fieldset className="rounded-xl border border-neutral-200 bg-white p-5">
          <legend className="px-1 text-sm font-semibold text-neutral-900">Order note</legend>
          <div className="mt-3">
            <Textarea
              aria-label="Order note"
              className="min-h-20"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything the seller should know (optional)"
            />
          </div>
        </fieldset>
      </div>

      <div className="h-fit rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Order summary</h2>
        <ul className="mt-3 space-y-2 text-sm text-neutral-600">
          {lines.map((line) => (
            <li
              key={`${line.productName}-${line.vendorName}`}
              className="flex justify-between gap-3"
            >
              <span className="min-w-0 truncate">
                {line.productName} × {line.quantity}
                <span className="block text-xs text-neutral-500">{line.vendorName}</span>
              </span>
              <span className="shrink-0 text-neutral-900">
                {formatPesewas(line.lineTotalPesewas)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-neutral-200 pt-3 text-sm">
          <div className="flex justify-between text-neutral-600">
            <dt>Subtotal</dt>
            <dd className="text-neutral-900">{formatPesewas(subtotalPesewas)}</dd>
          </div>
          <div className="flex justify-between text-neutral-600">
            <dt>Delivery</dt>
            <dd className="text-neutral-900">
              {deliveryFeePesewas === 0 ? "Free pickup" : "Calculated per seller"}
            </dd>
          </div>
          <div className="flex justify-between font-semibold text-neutral-900">
            <dt>Total</dt>
            <dd>{formatPesewas(subtotalPesewas + deliveryFeePesewas)}</dd>
          </div>
        </dl>

        {error ? (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="mt-4 w-full" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          )}
          {pending ? "Placing order…" : "Place order and pay"}
        </Button>
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Payments are processed by Paystack. The card or mobile money details never touch our
          servers.
        </p>
      </div>
    </form>
  );
}
