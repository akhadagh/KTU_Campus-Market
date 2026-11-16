"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface PlatformSettingsValues {
  marketplaceName: string;
  tagline: string;
  supportEmail: string;
  platformFeePercent: number;
  refundWindowDays: number;
  paymentWindowMinutes: number;
  maintenanceMode: boolean;
}

export function PlatformSettingsForm({ initialValues }: { initialValues: PlatformSettingsValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not save the settings");
        return;
      }
      toast.success("Platform settings saved");
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
          <label htmlFor="setting-name" className="mb-1 block text-xs font-medium text-neutral-700">
            Marketplace name
          </label>
          <Input
            id="setting-name"
            value={values.marketplaceName}
            onChange={(event) => setValues({ ...values, marketplaceName: event.target.value })}
          />
        </div>
        <div>
          <label
            htmlFor="setting-tagline"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Tagline
          </label>
          <Input
            id="setting-tagline"
            value={values.tagline}
            onChange={(event) => setValues({ ...values, tagline: event.target.value })}
          />
        </div>
        <div>
          <label
            htmlFor="setting-support"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Support email
          </label>
          <Input
            id="setting-support"
            type="email"
            value={values.supportEmail}
            onChange={(event) => setValues({ ...values, supportEmail: event.target.value })}
            placeholder="support@jumart.market"
          />
        </div>
        <div>
          <label htmlFor="setting-fee" className="mb-1 block text-xs font-medium text-neutral-700">
            Platform commission (%)
          </label>
          <Input
            id="setting-fee"
            type="number"
            step="0.5"
            min="0"
            max="50"
            value={values.platformFeePercent}
            onChange={(event) =>
              setValues({ ...values, platformFeePercent: Number(event.target.value) })
            }
          />
        </div>
        <div>
          <label
            htmlFor="setting-refund"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Refund window (days)
          </label>
          <Input
            id="setting-refund"
            type="number"
            min="0"
            max="90"
            value={values.refundWindowDays}
            onChange={(event) =>
              setValues({ ...values, refundWindowDays: Number(event.target.value) })
            }
          />
        </div>
        <div>
          <label
            htmlFor="setting-payment"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Payment window (minutes)
          </label>
          <Input
            id="setting-payment"
            type="number"
            min="5"
            max="240"
            value={values.paymentWindowMinutes}
            onChange={(event) =>
              setValues({ ...values, paymentWindowMinutes: Number(event.target.value) })
            }
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          className="accent-brand-700 h-4 w-4"
          checked={values.maintenanceMode}
          onChange={(event) => setValues({ ...values, maintenanceMode: event.target.checked })}
        />
        Maintenance mode (new sign-ups and listings are paused)
      </label>

      <Button className="mt-5" onClick={save} disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="h-4 w-4" aria-hidden="true" />
        )}
        Save settings
      </Button>
    </Card>
  );
}
