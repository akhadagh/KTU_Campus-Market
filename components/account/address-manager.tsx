"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface AddressRecord {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  campus: string | null;
  instructions: string | null;
  isDefault: boolean;
}

export function AddressManager({ addresses }: { addresses: AddressRecord[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "",
    recipientName: "",
    phone: "",
    address: "",
    campus: "",
    instructions: "",
    isDefault: addresses.length === 0,
  });

  async function save() {
    setPending("save");
    try {
      const res = await fetch("/api/v1/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not save the address");
        return;
      }
      toast.success("Address saved");
      setOpen(false);
      setForm({
        label: "",
        recipientName: "",
        phone: "",
        address: "",
        campus: "",
        instructions: "",
        isDefault: false,
      });
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  async function remove(id: string) {
    setPending(id);
    try {
      const res = await fetch(`/api/v1/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not remove the address");
        return;
      }
      toast.success("Address removed");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  async function makeDefault(id: string) {
    setPending(id);
    try {
      const res = await fetch(`/api/v1/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) {
        toast.error("Could not update the address");
        return;
      }
      toast.success("Default delivery address updated");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm font-medium text-neutral-900">No saved addresses</p>
          <p className="mt-1 text-sm text-neutral-600">
            Save a delivery address to check out faster next time.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">
                    {address.label}
                    {address.isDefault ? (
                      <span className="bg-brand-50 text-brand-700 ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-neutral-700">{address.recipientName}</p>
                  <p className="text-sm text-neutral-600">{address.phone}</p>
                  <p className="mt-1 text-sm text-neutral-600">{address.address}</p>
                  {address.campus ? (
                    <p className="text-xs text-neutral-500">{address.campus}</p>
                  ) : null}
                  {address.instructions ? (
                    <p className="text-xs text-neutral-500">{address.instructions}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => remove(address.id)}
                    disabled={pending !== null}
                    aria-label={`Delete ${address.label} address`}
                    className="focus-visible:ring-brand-500/30 grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
                  >
                    {pending === address.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              {!address.isDefault ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => makeDefault(address.id)}
                  disabled={pending !== null}
                >
                  Make default
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {open ? (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-neutral-900">Add a delivery address</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="address-label"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Label
              </label>
              <Input
                id="address-label"
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
                placeholder="Home, Hostel, Office"
              />
            </div>
            <div>
              <label
                htmlFor="address-recipient"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Recipient name
              </label>
              <Input
                id="address-recipient"
                value={form.recipientName}
                onChange={(event) => setForm({ ...form, recipientName: event.target.value })}
                placeholder="Ama Mensah"
              />
            </div>
            <div>
              <label
                htmlFor="address-phone"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Phone
              </label>
              <Input
                id="address-phone"
                inputMode="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="0241234567"
              />
            </div>
            <div>
              <label
                htmlFor="address-campus"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Campus / area
              </label>
              <Input
                id="address-campus"
                value={form.campus}
                onChange={(event) => setForm({ ...form, campus: event.target.value })}
                placeholder="KTU Main Campus"
              />
            </div>
          </div>
          <div className="mt-3">
            <label
              htmlFor="address-line"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Address
            </label>
            <Input
              id="address-line"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="Hostel B, room 12, Adum campus"
            />
          </div>
          <div className="mt-3">
            <label
              htmlFor="address-instructions"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Delivery instructions
            </label>
            <Textarea
              id="address-instructions"
              className="min-h-16"
              value={form.instructions}
              onChange={(event) => setForm({ ...form, instructions: event.target.value })}
              placeholder="Call when you arrive at the gate"
            />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              className="accent-brand-700 h-4 w-4"
              checked={form.isDefault}
              onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}
            />
            Use as my default delivery address
          </label>
          <div className="mt-4 flex gap-2">
            <Button onClick={save} disabled={pending !== null}>
              {pending === "save" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Save address
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add delivery address
        </Button>
      )}
    </div>
  );
}
