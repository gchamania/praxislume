import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const campaignDurationSchema = z.union([z.literal(7), z.literal(15), z.literal(30)]);

export const contentCategorySchema = z.enum([
  'awareness',
  'myth_buster',
  'symptoms',
  'procedure_explainer',
  'seasonal_health_tip',
  'clinic_service',
  'faq'
]);

export const contentStatusSchema = z.enum(['idea', 'drafted', 'designed', 'posted']);

export const generationToneSchema = z.enum([
  'warm',
  'authoritative',
  'simple',
  'premium',
  'local_language_friendly'
]);

export const complianceStatusSchema = z.enum(['passed', 'flagged', 'blocked']);

export const apiErrorCodeSchema = z.enum([
  'validation_error',
  'unauthorized',
  'forbidden',
  'rate_limited',
  'patient_data_rejected',
  'provider_error',
  'provider_timeout',
  'quota_exceeded',
  'internal_error'
]);

export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string().min(1)
});

export const apiSuccessEnvelopeSchema = z.object({
  ok: z.literal(true),
  data: z.unknown(),
  requestId: z.string().min(1)
});

export const apiErrorEnvelopeSchema = z.object({
  ok: z.literal(false),
  error: apiErrorSchema,
  requestId: z.string().min(1)
});

const serviceListSchema = z.array(z.string().trim().min(1).max(120)).min(1).max(20);

export const campaignPlanRequestSchema = z.object({
  clinicId: uuidSchema,
  idempotencyKey: z.string().trim().min(3).max(120),
  durationDays: campaignDurationSchema,
  specialty: z.string().trim().min(2).max(120),
  services: serviceListSchema,
  locality: z.string().trim().min(2).max(120),
  goal: z.string().trim().min(3).max(240),
  tone: generationToneSchema,
  ctaPreference: z.string().trim().min(2).max(180),
  disclaimerPreference: z.string().trim().min(2).max(240)
});

export const campaignPlanItemSchema = z.object({
  dayOffset: z.number().int().min(0).max(29),
  title: z.string().min(1).max(140),
  category: contentCategorySchema,
  objective: z.string().min(1).max(240),
  keyPoints: z.array(z.string().min(1).max(180)).min(1).max(5),
  caption: z.string().min(1).max(2200),
  shortCta: z.string().min(1).max(180),
  hashtags: z.array(z.string().min(1).max(40)).max(10).optional(),
  reelHook: z.string().min(1).max(180).optional(),
  reelScript: z.string().min(1).max(1200).optional(),
  disclaimerNeeded: z.boolean()
});

export const campaignPlanResponseSchema = z.object({
  items: z.array(campaignPlanItemSchema).min(1).max(30)
});

export const captionGenerationRequestSchema = z.object({
  clinicId: uuidSchema,
  title: z.string().trim().min(2).max(140),
  specialty: z.string().trim().min(2).max(120),
  services: serviceListSchema.optional(),
  locality: z.string().trim().min(2).max(120).optional(),
  tone: generationToneSchema,
  keyPoints: z.array(z.string().trim().min(1).max(180)).min(1).max(5),
  ctaPreference: z.string().trim().min(2).max(180),
  disclaimerPreference: z.string().trim().min(2).max(240).optional()
});

export const captionGenerationResponseSchema = z.object({
  caption: z.string().min(1).max(2200),
  shortCta: z.string().min(1).max(180),
  disclaimerNeeded: z.boolean()
});

export const reelScriptRequestSchema = z.object({
  clinicId: uuidSchema,
  title: z.string().trim().min(2).max(140),
  specialty: z.string().trim().min(2).max(120),
  services: serviceListSchema.optional(),
  locality: z.string().trim().min(2).max(120).optional(),
  tone: generationToneSchema,
  keyPoints: z.array(z.string().trim().min(1).max(180)).min(1).max(5),
  ctaPreference: z.string().trim().min(2).max(180),
  disclaimerPreference: z.string().trim().min(2).max(240).optional()
});

export const reelScriptResponseSchema = z.object({
  reelHook: z.string().min(1).max(180),
  reelScript: z.string().min(1).max(1200),
  shortCta: z.string().min(1).max(180)
});

export const toneRewriteRequestSchema = z.object({
  clinicId: uuidSchema,
  content: z.string().trim().min(2).max(2200),
  tone: generationToneSchema,
  specialty: z.string().trim().min(2).max(120).optional(),
  services: serviceListSchema.optional(),
  locality: z.string().trim().min(2).max(120).optional(),
  ctaPreference: z.string().trim().min(2).max(180).optional(),
  disclaimerPreference: z.string().trim().min(2).max(240).optional()
});

export const toneRewriteResponseSchema = z.object({
  rewrittenContent: z.string().min(1).max(2200)
});

export const complianceReviewRequestSchema = z.object({
  clinicId: uuidSchema,
  content: z.string().trim().min(2).max(5000),
  contentVersionHash: z.string().trim().min(3).max(160)
});

export const complianceReviewResponseSchema = z.object({
  status: complianceStatusSchema,
  issueCodes: z.array(z.string().min(1)).default([]),
  notes: z.array(z.string().min(1)).default([]),
  saferRewrite: z.string().optional(),
  reviewedContentVersionHash: z.string().min(1)
});

const patientDataPatterns: Array<{ code: string; pattern: RegExp }> = [
  { code: 'phone_number', pattern: /(?:\+?\d[\s-]?){10,}/i },
  { code: 'medical_record_number', pattern: /\b(?:mrn|medical record|patient id|uhid)\b/i },
  { code: 'lab_report', pattern: /\b(?:blood report|lab report|scan report|x-ray|mri report|ct report)\b/i },
  { code: 'case_history', pattern: /\b(?:case history|patient history|my patient|patient named)\b/i }
];

const patientGuardMetadataKeys = new Set([
  'brandKitId',
  'campaignId',
  'clinicId',
  'contentItemId',
  'contentVersionHash',
  'idempotencyKey',
  'requestId'
]);

export function patientDataGuard(input: unknown): { ok: true } | { ok: false; issueCodes: string[] } {
  const text = collectPatientDataText(input).join('\n');
  const issueCodes = patientDataPatterns
    .filter(({ pattern }) => pattern.test(text))
    .map(({ code }) => code);

  return issueCodes.length === 0 ? { ok: true } : { ok: false, issueCodes };
}

function collectPatientDataText(input: unknown, key?: string): string[] {
  if (key && patientGuardMetadataKeys.has(key)) {
    return [];
  }

  if (typeof input === 'string') {
    return [input];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => collectPatientDataText(item));
  }

  if (input && typeof input === 'object') {
    return Object.entries(input).flatMap(([entryKey, value]) => collectPatientDataText(value, entryKey));
  }

  return [];
}

export type CampaignPlanRequest = z.infer<typeof campaignPlanRequestSchema>;
export type CampaignPlanResponse = z.infer<typeof campaignPlanResponseSchema>;
export type CaptionGenerationRequest = z.infer<typeof captionGenerationRequestSchema>;
export type ReelScriptRequest = z.infer<typeof reelScriptRequestSchema>;
export type ToneRewriteRequest = z.infer<typeof toneRewriteRequestSchema>;
export type ComplianceReviewRequest = z.infer<typeof complianceReviewRequestSchema>;
export type ComplianceReviewResponse = z.infer<typeof complianceReviewResponseSchema>;
