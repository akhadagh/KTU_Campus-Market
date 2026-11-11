import type { Metadata } from "next";
import { AssistantChat } from "@/components/ai/assistant-chat";
import { PageHeader } from "@/components/ui/page-header";
import { aiConfigured } from "@/lib/ai";

export const metadata: Metadata = {
  title: "Campus assistant",
  description: "Ask for campus products and services and get answers grounded in live listings.",
};

export default function AssistantPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Campus assistant"
        description="Describe what you need and the assistant searches live, approved listings for you."
      />
      {!aiConfigured() ? (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          The AI provider is not configured on this deployment, so answers come from the live
          listing index instead of a language model.
        </p>
      ) : null}
      <div className="mt-6">
        <AssistantChat />
      </div>
    </div>
  );
}
