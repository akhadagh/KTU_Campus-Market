"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SupportComposer({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and a short message");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "SUPPORT", subject: subject.trim(), body: body.trim() }),
      });
      const json = (await res.json()) as {
        data?: { conversationId?: string };
        error?: { message?: string };
      };
      if (!res.ok || !json.data?.conversationId) {
        toast.error(json.error?.message ?? "Could not send your message");
        return;
      }
      toast.success("Message sent to JUMART", {
        description: "Our team will reply here and by notification.",
      });
      setOpen(false);
      setSubject("");
      setBody("");
      router.push(`/messages?c=${json.data.conversationId}`);
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact JUMART</DialogTitle>
          <DialogDescription>
            Tell us what you need. Support requests are answered by the JUMART team, usually within
            a working day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="support-subject"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Subject
            </label>
            <Input
              id="support-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. My order has not been delivered"
            />
          </div>
          <div>
            <label
              htmlFor="support-body"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Message
            </label>
            <Textarea
              id="support-body"
              className="min-h-32"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Include your order number if this is about an order."
            />
          </div>
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Send to JUMART
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
