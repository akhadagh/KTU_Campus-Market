import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Messages"
        description="Buyer–vendor conversations are private and visible only to the participants."
      />
      <div className="mt-6">
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Messaging is connected in Milestone 6. Only conversation participants will be able to read or send messages."
          action={
            <Link href="/marketplace" className={buttonVariants()}>
              Browse vendors
            </Link>
          }
        />
      </div>
    </div>
  );
}
