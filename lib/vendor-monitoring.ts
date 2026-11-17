import { prisma } from "@/lib/db";

export interface VendorRiskSignal {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Ongoing monitoring for an approved store. Signals are advisory: they never
 * suspend a store automatically, they make the situation visible to staff.
 */
export async function getVendorRiskSignals(vendorId: string): Promise<VendorRiskSignal[]> {
  const since = new Date(Date.now() - 30 * DAY_MS);
  const signals: VendorRiskSignal[] = [];

  const [products, openReports, failedPayments, reviews, vendor] = await Promise.all([
    prisma.product.findMany({
      where: { vendorId, deletedAt: null },
      select: { id: true },
    }),
    prisma.report.count({
      where: {
        status: { in: ["OPEN", "IN_REVIEW"] },
        OR: [
          { targetType: "VENDOR", targetId: vendorId },
          { targetType: "PRODUCT", targetId: { in: [] } },
        ],
        createdAt: { gte: since },
      },
    }),
    prisma.payment.count({
      where: {
        status: "FAILED",
        createdAt: { gte: since },
        order: { vendorOrders: { some: { vendorId } } },
      },
    }),
    prisma.review.findMany({
      where: { vendorId, status: "PUBLISHED", deletedAt: null },
      select: { rating: true, buyerId: true, createdAt: true },
    }),
    prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      select: { verifiedAt: true, status: true, storeName: true },
    }),
  ]);

  const productIds = products.map((product) => product.id);
  const productReports = productIds.length
    ? await prisma.report.count({
        where: {
          status: { in: ["OPEN", "IN_REVIEW"] },
          targetType: "PRODUCT",
          targetId: { in: productIds },
          createdAt: { gte: since },
        },
      })
    : 0;
  const totalReports = openReports + productReports;

  if (totalReports >= 3) {
    signals.push({
      code: "complaint_velocity",
      severity: "high",
      message: `${totalReports} unresolved reports in the last 30 days.`,
    });
  } else if (totalReports > 0) {
    signals.push({
      code: "complaint_velocity",
      severity: "medium",
      message: `${totalReports} unresolved report(s) in the last 30 days.`,
    });
  }

  if (failedPayments >= 3) {
    signals.push({
      code: "payment_failures",
      severity: "medium",
      message: `${failedPayments} failed payment attempts in the last 30 days.`,
    });
  }

  const fiveStar = reviews.filter((review) => review.rating === 5).length;
  const distinctBuyers = new Set(reviews.map((review) => review.buyerId)).size;
  if (reviews.length >= 5 && fiveStar === reviews.length && distinctBuyers === reviews.length) {
    signals.push({
      code: "review_integrity",
      severity: "medium",
      message:
        "Every published review is five stars from a different buyer. Check that the reviews are genuine.",
    });
  }

  if (vendor?.verifiedAt) {
    const ageDays = (Date.now() - vendor.verifiedAt.getTime()) / DAY_MS;
    if (ageDays > 365) {
      signals.push({
        code: "reverification_due",
        severity: "low",
        message: `Verified ${Math.round(ageDays)} days ago. Ask the seller to confirm their details again.`,
      });
    }
  }

  if (vendor?.status === "ACTIVE" && reviews.length === 0) {
    signals.push({
      code: "no_reviews",
      severity: "low",
      message: "No published reviews yet. New stores carry more buyer risk.",
    });
  }

  return signals;
}

export async function getAllVendorRiskSignals(): Promise<
  { vendorId: string; storeName: string; signals: VendorRiskSignal[] }[]
> {
  const vendors = await prisma.vendorProfile.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: { id: true, storeName: true },
  });
  return Promise.all(
    vendors.map(async (vendor) => ({
      vendorId: vendor.id,
      storeName: vendor.storeName,
      signals: await getVendorRiskSignals(vendor.id),
    })),
  );
}
