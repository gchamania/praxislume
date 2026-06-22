import { describe, expect, it } from 'vitest';
import {
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  campaignPlanRequestSchema,
  campaignPlanResponseSchema,
  complianceReviewRequestSchema,
  contentCategorySchema,
  contentStatusSchema,
  generationToneSchema,
  patientDataGuard
} from '../src/index.js';

describe('shared contracts', () => {
  it('accepts only MVP content categories and statuses', () => {
    expect(contentCategorySchema.parse('myth_buster')).toBe('myth_buster');
    expect(contentStatusSchema.parse('drafted')).toBe('drafted');
    expect(() => contentCategorySchema.parse('dance_trend')).toThrow();
    expect(() => contentStatusSchema.parse('scheduled')).toThrow();
  });

  it('validates campaign-plan requests without patient-identifiable fields', () => {
    const parsed = campaignPlanRequestSchema.parse({
      clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
      idempotencyKey: 'campaign-001',
      durationDays: 30,
      specialty: 'Dermatology',
      services: ['Acne consultation', 'Skin allergy care'],
      locality: 'Pune',
      goal: 'increase appointment enquiries',
      tone: 'warm',
      ctaPreference: 'Book a consultation',
      disclaimerPreference: 'For general education only.'
    });

    expect(parsed.durationDays).toBe(30);
    expect(generationToneSchema.parse(parsed.tone)).toBe('warm');
  });

  it('rejects obvious patient-identifiable request text', () => {
    expect(patientDataGuard('Patient phone 9876543210 needs review').ok).toBe(false);
    expect(patientDataGuard('MRN 1234 and blood report attached').ok).toBe(false);
    expect(patientDataGuard('General monsoon skin care awareness').ok).toBe(true);
  });

  it('does not treat operational request metadata as patient data', () => {
    expect(
      patientDataGuard({
        clinicId: '99999999-9999-4999-8999-999999999999',
        idempotencyKey: 'pl13-1782135771041',
        durationDays: 7,
        specialty: 'ENT',
        services: ['Sinus consultation'],
        locality: 'Pune',
        goal: 'increase appointment enquiries',
        tone: 'simple',
        ctaPreference: 'Book an ENT consultation',
        disclaimerPreference: 'For general education only.'
      }).ok
    ).toBe(true);
  });

  it('validates campaign-plan responses and API envelopes', () => {
    const response = campaignPlanResponseSchema.parse({
      items: [
        {
          dayOffset: 0,
          title: 'Why early skin allergy care helps',
          category: 'awareness',
          objective: 'educate patients',
          keyPoints: ['Common triggers', 'When to consult'],
          caption: 'Skin allergy symptoms can vary. Consult a qualified doctor for guidance.',
          shortCta: 'Book a skin consultation',
          hashtags: ['#SkinHealth'],
          reelHook: 'Itchy skin in monsoon?',
          reelScript: 'Here are simple signs that mean you should speak to a dermatologist.',
          disclaimerNeeded: true
        }
      ]
    });

    expect(response.items).toHaveLength(1);
    expect(apiSuccessEnvelopeSchema.parse({ ok: true, data: response, requestId: 'req_1' }).ok).toBe(true);
    expect(apiErrorEnvelopeSchema.parse({ ok: false, error: { code: 'validation_error', message: 'Bad request' }, requestId: 'req_1' }).ok).toBe(false);
  });

  it('validates compliance review requests', () => {
    const parsed = complianceReviewRequestSchema.parse({
      clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
      content: 'This is general education and not a substitute for a consultation.',
      contentVersionHash: 'sha256-safe'
    });

    expect(parsed.contentVersionHash).toBe('sha256-safe');
  });
});
