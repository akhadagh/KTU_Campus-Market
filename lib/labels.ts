export const vendorStatusLabels: Record<string, string> = {
  PENDING: "Pending review",
  ACTIVE: "Active",
  PAUSED: "Paused",
  SUSPENDED: "Suspended",
  CLOSED: "Closed",
};

export const productStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  ACTIVE: "Active",
  REJECTED: "Rejected",
  OUT_OF_STOCK: "Out of stock",
  ARCHIVED: "Archived",
};

export const orderStatusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  PARTIALLY_FULFILLED: "Partially fulfilled",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  DISPUTED: "Disputed",
};

export const vendorOrderStatusLabels: Record<string, string> = {
  PENDING: "New",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const conditionLabels: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  USED_GOOD: "Used — good",
  USED_FAIR: "Used — fair",
  REFURBISHED: "Refurbished",
  NOT_SPECIFIED: "Not specified",
};

export const deliveryLabels: Record<string, string> = {
  PICKUP: "Campus pickup",
  CAMPUS_DELIVERY: "Campus delivery",
  COURIER: "Courier",
};

export function statusBadgeVariant(
  status: string,
): "default" | "success" | "warning" | "muted" | "danger" {
  switch (status) {
    case "ACTIVE":
    case "VERIFIED":
    case "PAID":
    case "FULFILLED":
    case "DELIVERED":
      return "success";
    case "PENDING":
    case "PENDING_REVIEW":
    case "PENDING_PAYMENT":
    case "PAUSED":
    case "OUT_OF_STOCK":
      return "warning";
    case "REJECTED":
    case "SUSPENDED":
    case "CANCELLED":
    case "DISPUTED":
      return "danger";
    case "DRAFT":
    case "ARCHIVED":
    case "CLOSED":
      return "muted";
    default:
      return "default";
  }
}
