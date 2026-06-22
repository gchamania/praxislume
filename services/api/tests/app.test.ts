import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

const env = {
  NODE_ENV: 'test',
  PORT: '8787',
  HOST: '127.0.0.1',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  AI_PROVIDER: 'fake',
  DEFAULT_DRAFT_MODEL: 'fake-draft-v1',
  GENERATION_TIMEOUT_MS: '5000',
  GENERATION_DAILY_LIMIT: '50'
};

describe('PraxisLume API', () => {
  it('returns health and readiness envelopes', async () => {
    const app = buildApp({ env });

    const health = await app.inject({ method: 'GET', url: '/health' });
    const ready = await app.inject({ method: 'GET', url: '/ready' });

    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({ ok: true, data: { status: 'ok' } });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toMatchObject({ ok: true, data: { status: 'ready', provider: 'fake' } });
  });

  it('rejects protected generation routes without authorization', async () => {
    const app = buildApp({ env });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      payload: {}
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      ok: false,
      error: { code: 'unauthorized' }
    });
  });

  it('generates a deterministic fake campaign plan for authorized requests', async () => {
    const app = buildApp({ env, allowTestTokens: true });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
        idempotencyKey: 'campaign-001',
        durationDays: 7,
        specialty: 'ENT',
        services: ['Ear infection care', 'Sinus consultation'],
        locality: 'Pune',
        goal: 'increase appointment enquiries',
        tone: 'simple',
        ctaPreference: 'Book an ENT consultation',
        disclaimerPreference: 'For general education only.'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.items).toHaveLength(7);
    expect(response.json().data.items[0]).toMatchObject({
      category: 'awareness',
      shortCta: 'Book an ENT consultation'
    });
  });

  it('rejects patient-identifiable generation input before provider calls', async () => {
    const app = buildApp({ env, allowTestTokens: true });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/content-item-caption',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
        title: 'Patient phone 9876543210 case',
        specialty: 'Dermatology',
        tone: 'warm',
        keyPoints: ['blood report attached'],
        ctaPreference: 'Book a consultation'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      ok: false,
      error: { code: 'patient_data_rejected' }
    });
  });

  it('flags unsafe compliance claims', async () => {
    const app = buildApp({ env, allowTestTokens: true });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/compliance/review',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
        content: 'We guarantee a cure and are the best clinic in town.',
        contentVersionHash: 'sha256-unsafe'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.status).toBe('flagged');
    expect(response.json().data.issueCodes).toEqual(expect.arrayContaining(['cure_guarantee', 'superiority_claim']));
  });
});
