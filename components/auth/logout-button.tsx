"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    try {
      const res = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("logout failed");
      toast.success("You have been logged out");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not log out", { description: "Please try again." });
      setPending(false);
    }
  }

  return (
    <Button variant="outline" onClick={onLogout} disabled={pending}>
      {pending ? "Signing out…" : "Log out"}
    </Button>
  );
}
