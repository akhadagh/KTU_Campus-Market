import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: z.string().url().optional(),
  AI_ENABLED: z.enum(["true", "false"]).default("false"),
  FEATURE_AI_ASSISTANT: z.enum(["true", "false"]).default("false"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Validate and return environment variables.
 * Intentionally lazy so builds do not require optional integrations.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  cached = parsed.data;
  return cached;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isAiEnabled(): boolean {
  return getEnv().AI_ENABLED === "true" && getEnv().FEATURE_AI_ASSISTANT === "true";
}
