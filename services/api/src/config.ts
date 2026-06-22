import { z } from 'zod';

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().min(1).default('127.0.0.1'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AI_PROVIDER: z.enum(['fake']).default('fake'),
  DEFAULT_DRAFT_MODEL: z.string().min(1).default('fake-draft-v1'),
  GENERATION_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  GENERATION_DAILY_LIMIT: z.coerce.number().int().positive().default(50)
});

export type ApiConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined>): ApiConfig {
  return configSchema.parse(env);
}
