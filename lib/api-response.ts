export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "EMAIL_NOT_VERIFIED"
  | "ACCOUNT_SUSPENDED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_FAILED"
  | "PROVIDER_UNAVAILABLE"
  | "INTERNAL_ERROR";

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ data, error: null, meta: null }, init);
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status: number,
  fields?: Record<string, string>,
): Response {
  return Response.json(
    { data: null, error: fields ? { code, message, fields } : { code, message }, meta: null },
    { status },
  );
}

export function fieldsFromZod(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "_");
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}
