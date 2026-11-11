"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface ThreadMessage {
  id: string;
  body: string;
  createdAt: string;
  mine: boolean;
  senderName: string;
}

export function MessageThread({
  conversationId,
  messages,
  peerName,
}: {
  conversationId: string;
  messages: ThreadMessage[];
  peerName: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function send() {
    if (!body.trim()) return;
    setPending(true);
    try {
      const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not send the message");
        return;
      }
      setBody("");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No messages yet. Ask about availability, pickup points, or delivery.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={message.mine ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  message.mine
                    ? "bg-brand-700 max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2 text-sm text-white"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-2 text-sm text-neutral-800"
                }
              >
                <p>{message.body}</p>
                <p
                  className={
                    message.mine
                      ? "text-brand-100 mt-1 text-right text-[11px]"
                      : "mt-1 text-[11px] text-neutral-500"
                  }
                >
                  {message.senderName} ·{" "}
                  {new Intl.DateTimeFormat("en-GH", { timeStyle: "short" }).format(
                    new Date(message.createdAt),
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="mt-4 flex items-end gap-2"
      >
        <div className="flex-1">
          <label htmlFor="message-body" className="sr-only">
            Message to {peerName}
          </label>
          <Textarea
            id="message-body"
            className="min-h-16"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={`Message ${peerName}`}
          />
        </div>
        <Button type="submit" disabled={pending || !body.trim()}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
