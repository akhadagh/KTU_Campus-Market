import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { prisma } from "@/lib/db";

const schema = z.object({
  orders: z.boolean(),
  messages: z.boolean(),
  promotions: z.boolean(),
  personalization: z.boolean(),
});

export async function PUT(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Check the notification preferences.", 422);
  }
  const values = parsed.data;

  const preference = await prisma.userPreference.upsert({
    where: { userId: guard.auth.user.id },
    create: {
      userId: guard.auth.user.id,
      notificationPrefsJson: {
        orders: values.orders,
        messages: values.messages,
        promotions: values.promotions,
      },
      personalizationEnabled: values.personalization,
    },
    update: {
      notificationPrefsJson: {
        orders: values.orders,
        messages: values.messages,
        promotions: values.promotions,
      },
      personalizationEnabled: values.personalization,
    },
    select: { userId: true, notificationPrefsJson: true, personalizationEnabled: true },
  });

  return ok({ preference });
}
