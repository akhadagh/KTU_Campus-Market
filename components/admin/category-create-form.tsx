"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function CategoryCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("PRODUCT");
  const [sortOrder, setSortOrder] = useState("0");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (name.trim().length < 2) {
      toast.error("Add a category name");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/v1/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, sortOrder: Number(sortOrder) || 0 }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not create the category");
        return;
      }
      toast.success("Category created");
      setName("");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        New category
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="category-name" className="mb-1 block text-xs font-medium text-neutral-700">
          Name
        </label>
        <Input
          id="category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Hostel Electronics"
        />
      </div>
      <div>
        <label htmlFor="category-type" className="mb-1 block text-xs font-medium text-neutral-700">
          Type
        </label>
        <Select id="category-type" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="PRODUCT">Product</option>
          <option value="SERVICE">Service</option>
        </Select>
      </div>
      <div className="w-28">
        <label htmlFor="category-order" className="mb-1 block text-xs font-medium text-neutral-700">
          Order
        </label>
        <Input
          id="category-order"
          type="number"
          min="0"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={submit} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Create
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
