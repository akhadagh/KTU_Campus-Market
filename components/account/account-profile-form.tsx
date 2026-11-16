"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AccountProfileForm({
  user,
  preferences,
}: {
  user: { fullName: string; email: string; phone: string; emailVerified: boolean };
  preferences: {
    orders: boolean;
    messages: boolean;
    promotions: boolean;
    personalization: boolean;
  };
}) {
  const router = useRouter();
  const [details, setDetails] = useState({
    fullName: user.fullName,
    phone: user.phone,
  });
  const [prefs, setPrefs] = useState(preferences);
  const [password, setPassword] = useState({ current: "", next: "" });
  const [pending, setPending] = useState<string | null>(null);

  async function saveDetails() {
    setPending("details");
    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not save your details");
        return;
      }
      toast.success("Profile updated");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  async function savePreferences() {
    setPending("preferences");
    try {
      const res = await fetch("/api/v1/users/me/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not save your preferences");
        return;
      }
      toast.success("Notification preferences saved");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  async function changePassword() {
    setPending("password");
    try {
      const res = await fetch("/api/v1/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not change your password");
        return;
      }
      toast.success("Password changed", {
        description: "Every other session has been signed out.",
      });
      setPassword({ current: "", next: "" });
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Personal details</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Your email address is {user.emailVerified ? "verified" : "not verified yet"}. Change it
          from the account security page.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-name"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Full name
            </label>
            <Input
              id="profile-name"
              value={details.fullName}
              onChange={(event) => setDetails({ ...details, fullName: event.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="profile-phone"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Phone
            </label>
            <Input
              id="profile-phone"
              inputMode="tel"
              value={details.phone}
              onChange={(event) => setDetails({ ...details, phone: event.target.value })}
              placeholder="0241234567"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="profile-email"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Email address
            </label>
            <Input id="profile-email" value={user.email} disabled readOnly />
          </div>
        </div>
        <Button className="mt-4" onClick={saveDetails} disabled={pending !== null}>
          {pending === "details" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Save details
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Notifications</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Choose what JUMART emails you about. Operational emails about orders and payments are
          always sent.
        </p>
        <div className="mt-4 space-y-2">
          {[
            { key: "orders" as const, label: "Order updates and fulfilment" },
            { key: "messages" as const, label: "New messages from sellers or support" },
            { key: "promotions" as const, label: "Promotions and campus deals" },
            { key: "personalization" as const, label: "Personalised recommendations" },
          ].map((row) => (
            <label key={row.key} className="flex items-center gap-3 text-sm text-neutral-700">
              <input
                type="checkbox"
                className="accent-brand-700 h-4 w-4"
                checked={prefs[row.key]}
                onChange={(event) => setPrefs({ ...prefs, [row.key]: event.target.checked })}
              />
              {row.label}
            </label>
          ))}
        </div>
        <Button
          className="mt-4"
          variant="outline"
          onClick={savePreferences}
          disabled={pending !== null}
        >
          {pending === "preferences" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Save preferences
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Change password</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Changing your password signs out every other session.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="current-password"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Current password
            </label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={password.current}
              onChange={(event) => setPassword({ ...password, current: event.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="next-password"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              New password
            </label>
            <Input
              id="next-password"
              type="password"
              autoComplete="new-password"
              value={password.next}
              onChange={(event) => setPassword({ ...password, next: event.target.value })}
            />
          </div>
        </div>
        <Button
          className="mt-4"
          variant="outline"
          onClick={changePassword}
          disabled={pending !== null}
        >
          {pending === "password" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="h-4 w-4" aria-hidden="true" />
          )}
          Update password
        </Button>
      </Card>
    </div>
  );
}
