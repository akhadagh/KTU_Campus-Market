"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function StoreSettingsForm({
  store,
}: {
  store: {
    storeName: string;
    description: string | null;
    phone: string | null;
    whatsapp: string | null;
    businessCategory: string | null;
    pickupAvailable: boolean;
    deliveryAvailable: boolean;
    logoUrl: string | null;
    bannerUrl: string | null;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    storeName: store.storeName,
    description: store.description ?? "",
    phone: store.phone ?? "",
    whatsapp: store.whatsapp ?? "",
    businessCategory: store.businessCategory ?? "",
    pickupAvailable: store.pickupAvailable,
    deliveryAvailable: store.deliveryAvailable,
    logoUrl: store.logoUrl ?? "",
    bannerUrl: store.bannerUrl ?? "",
  });
  const [pending, setPending] = useState(false);

  async function save() {
    if (form.storeName.trim().length < 3) {
      toast.error("Your store name needs at least 3 characters");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/v1/vendors/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not save your store");
        return;
      }
      toast.success("Store updated");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="store-name" className="mb-1 block text-xs font-medium text-neutral-700">
            Store name
          </label>
          <Input
            id="store-name"
            value={form.storeName}
            onChange={(event) => setForm({ ...form, storeName: event.target.value })}
          />
        </div>
        <div>
          <label
            htmlFor="store-category"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Business category
          </label>
          <Input
            id="store-category"
            value={form.businessCategory}
            onChange={(event) => setForm({ ...form, businessCategory: event.target.value })}
            placeholder="e.g. Electronics"
          />
        </div>
        <div>
          <label htmlFor="store-phone" className="mb-1 block text-xs font-medium text-neutral-700">
            Phone
          </label>
          <Input
            id="store-phone"
            inputMode="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </div>
        <div>
          <label
            htmlFor="store-whatsapp"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            WhatsApp
          </label>
          <Input
            id="store-whatsapp"
            inputMode="tel"
            value={form.whatsapp}
            onChange={(event) => setForm({ ...form, whatsapp: event.target.value })}
          />
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="store-description"
          className="mb-1 block text-xs font-medium text-neutral-700"
        >
          Store description
        </label>
        <Textarea
          id="store-description"
          className="min-h-28"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="What do you sell, and how do you deliver?"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="store-logo" className="mb-1 block text-xs font-medium text-neutral-700">
            Logo URL
          </label>
          <Input
            id="store-logo"
            type="url"
            value={form.logoUrl}
            onChange={(event) => setForm({ ...form, logoUrl: event.target.value })}
            placeholder="https://…"
          />
        </div>
        <div>
          <label htmlFor="store-banner" className="mb-1 block text-xs font-medium text-neutral-700">
            Banner URL
          </label>
          <Input
            id="store-banner"
            type="url"
            value={form.bannerUrl}
            onChange={(event) => setForm({ ...form, bannerUrl: event.target.value })}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="accent-brand-700 h-4 w-4"
            checked={form.pickupAvailable}
            onChange={(event) => setForm({ ...form, pickupAvailable: event.target.checked })}
          />
          Students can collect orders from my pickup point
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="accent-brand-700 h-4 w-4"
            checked={form.deliveryAvailable}
            onChange={(event) => setForm({ ...form, deliveryAvailable: event.target.checked })}
          />
          I deliver on campus
        </label>
      </div>

      <Button className="mt-5" onClick={save} disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="h-4 w-4" aria-hidden="true" />
        )}
        Save store settings
      </Button>
    </Card>
  );
}
