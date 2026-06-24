import { z } from 'zod';

const generationProviderSchema = z.enum(['fake', 'openai_compatible']);
const imageProviderSchema = z.enum(['fake', 'openai_compatible']);
const optionalEnvString = z.preprocess((value) => (value === '' ? undefined : value), z.string().min(1).optional());
const optionalEnvUrl = z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional());
const optionalEnvBoolean = z.preprocess((value) => {
  if (value === '' || value === undefined) {
    return undefined;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return value;
}, z.boolean().optional());

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().min(1).default('127.0.0.1'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AI_PROVIDER: generationProviderSchema.default('fake'),
  CAMPAIGN_PLAN_PROVIDER: generationProviderSchema.optional(),
  CAPTION_PROVIDER: generationProviderSchema.optional(),
  REEL_SCRIPT_PROVIDER: generationProviderSchema.optional(),
  TONE_REWRITE_PROVIDER: generationProviderSchema.optional(),
  CAROUSEL_PROVIDER: generationProviderSchema.optional(),
  DEFAULT_DRAFT_MODEL: z.string().min(1).default('fake-draft-v1'),
  OPENAI_COMPATIBLE_BASE_URL: optionalEnvUrl,
  OPENAI_COMPATIBLE_API_KEY: optionalEnvString,
  OPENAI_COMPATIBLE_CAMPAIGN_MODEL: optionalEnvString,
  OPENAI_COMPATIBLE_COPY_MODEL: optionalEnvString,
  OPENAI_COMPATIBLE_CAROUSEL_MODEL: optionalEnvString,
  OPENAI_COMPATIBLE_THINKING: z.enum(['disabled', 'enabled']).optional(),
  OPENAI_COMPATIBLE_REASONING_EFFORT: z.enum(['high', 'max']).optional(),
  GENERATION_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  GENERATION_DAILY_LIMIT: z.coerce.number().int().positive().default(50),
  IMAGE_GENERATION_ENABLED: optionalEnvBoolean.default(false),
  IMAGE_PROVIDER: imageProviderSchema.default('fake'),
  IMAGE_COMPATIBLE_BASE_URL: optionalEnvUrl,
  IMAGE_COMPATIBLE_API_KEY: optionalEnvString,
  IMAGE_COMPATIBLE_MODEL: optionalEnvString,
  IMAGE_COMPATIBLE_GENERATIONS_PATH: z.string().min(1).default('/images/generations'),
  IMAGE_GENERATION_DAILY_LIMIT: z.coerce.number().int().positive().default(5)
}).superRefine((config, context) => {
  const campaignProvider = config.CAMPAIGN_PLAN_PROVIDER ?? config.AI_PROVIDER;
  const captionProvider = config.CAPTION_PROVIDER ?? config.AI_PROVIDER;
  const reelProvider = config.REEL_SCRIPT_PROVIDER ?? config.AI_PROVIDER;
  const rewriteProvider = config.TONE_REWRITE_PROVIDER ?? config.AI_PROVIDER;
  const carouselProvider = config.CAROUSEL_PROVIDER ?? config.AI_PROVIDER;
  const liveProviders = [campaignProvider, captionProvider, reelProvider, rewriteProvider, carouselProvider].filter(
    (provider) => provider === 'openai_compatible'
  );

  if (liveProviders.length === 0) {
    return;
  }

  if (!config.OPENAI_COMPATIBLE_BASE_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['OPENAI_COMPATIBLE_BASE_URL'],
      message: 'OPENAI_COMPATIBLE_BASE_URL is required when any generation route uses openai_compatible'
    });
  }

  if (!config.OPENAI_COMPATIBLE_API_KEY) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['OPENAI_COMPATIBLE_API_KEY'],
      message: 'OPENAI_COMPATIBLE_API_KEY is required when any generation route uses openai_compatible'
    });
  }

  if (campaignProvider === 'openai_compatible' && !config.OPENAI_COMPATIBLE_CAMPAIGN_MODEL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['OPENAI_COMPATIBLE_CAMPAIGN_MODEL'],
      message: 'OPENAI_COMPATIBLE_CAMPAIGN_MODEL is required when campaign planning uses openai_compatible'
    });
  }

  const copyProviderUsesLive =
    captionProvider === 'openai_compatible' ||
    reelProvider === 'openai_compatible' ||
    rewriteProvider === 'openai_compatible' ||
    (carouselProvider === 'openai_compatible' && !config.OPENAI_COMPATIBLE_CAROUSEL_MODEL);
  if (copyProviderUsesLive && !config.OPENAI_COMPATIBLE_COPY_MODEL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['OPENAI_COMPATIBLE_COPY_MODEL'],
      message: 'OPENAI_COMPATIBLE_COPY_MODEL is required when copy or carousel generation uses openai_compatible without a carousel-specific model'
    });
  }

  if (!config.IMAGE_GENERATION_ENABLED || config.IMAGE_PROVIDER !== 'openai_compatible') {
    return;
  }

  if (!config.IMAGE_COMPATIBLE_BASE_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['IMAGE_COMPATIBLE_BASE_URL'],
      message: 'IMAGE_COMPATIBLE_BASE_URL is required when image generation uses openai_compatible'
    });
  }

  if (!config.IMAGE_COMPATIBLE_API_KEY) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['IMAGE_COMPATIBLE_API_KEY'],
      message: 'IMAGE_COMPATIBLE_API_KEY is required when image generation uses openai_compatible'
    });
  }

  if (!config.IMAGE_COMPATIBLE_MODEL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['IMAGE_COMPATIBLE_MODEL'],
      message: 'IMAGE_COMPATIBLE_MODEL is required when image generation uses openai_compatible'
    });
  }
});

export type ApiConfig = z.infer<typeof configSchema>;
export type GenerationProviderName = z.infer<typeof generationProviderSchema>;
export type ImageProviderName = z.infer<typeof imageProviderSchema>;

export function loadConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined>): ApiConfig {
  return configSchema.parse(env);
}
