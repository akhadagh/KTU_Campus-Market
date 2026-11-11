import type { NotificationType } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/db";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title.slice(0, 160),
      body: input.body ?? null,
      link: input.link ?? null,
    },
  });
}
