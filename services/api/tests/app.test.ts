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

  it('rejects bearer tokens that fail verification', async () => {
    const app = buildApp({ env, tokenVerifier: async () => null });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer invalid-token' },
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

  it('records the verified Supabase user id in generation logs', async () => {
    const generationStore = new RecordingGenerationStore();
    const verifiedUserId = '11111111-1111-4111-8111-111111111111';
    const seenTokens: string[] = [];
    const app = buildApp({
      env,
      generationStore,
      tokenVerifier: async (token) => {
        seenTokens.push(token);
        return token === 'valid-supabase-jwt' ? { userId: verifiedUserId } : null;
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer valid-supabase-jwt' },
      payload: {
        clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
        idempotencyKey: 'campaign-001',
        durationDays: 7,
        specialty: 'ENT',
        services: ['Ear infection care'],
        locality: 'Pune',
        goal: 'increase appointment enquiries',
        tone: 'simple',
        ctaPreference: 'Book an ENT consultation',
        disclaimerPreference: 'For general education only.'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(seenTokens).toEqual(['valid-supabase-jwt']);
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        userId: verifiedUserId,
        status: 'succeeded'
      })
    );
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

  it('persists compliance review metadata without raw content', async () => {
    const complianceStore = new RecordingComplianceReviewStore();
    const app = buildApp({ env, allowTestTokens: true, complianceStore });

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
    expect(complianceStore.entries).toEqual([
      expect.objectContaining({
        clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
        status: 'flagged',
        reviewedContentVersionHash: 'sha256-unsafe',
        reviewerType: 'rules'
      })
    ]);
    expect(complianceStore.entries[0]).not.toHaveProperty('content');
  });

  it('records successful generation attempts for every generation endpoint', async () => {
    const generationStore = new RecordingGenerationStore();
    const app = buildApp({ env, allowTestTokens: true, generationStore });
    const clinicId = '8a66fd06-dadc-4bdb-966a-2c701f74a287';

    const requests = [
      {
        url: '/v1/generations/campaign-plan',
        generationType: 'campaign_plan',
        payload: {
          clinicId,
          idempotencyKey: 'campaign-001',
          durationDays: 7,
          specialty: 'ENT',
          services: ['Ear infection care'],
          locality: 'Pune',
          goal: 'increase appointment enquiries',
          tone: 'simple',
          ctaPreference: 'Book an ENT consultation',
          disclaimerPreference: 'For general education only.'
        }
      },
      {
        url: '/v1/generations/content-item-caption',
        generationType: 'content_item_caption',
        payload: {
          clinicId,
          title: 'Sinus awareness',
          specialty: 'ENT',
          tone: 'warm',
          keyPoints: ['Know common warning signs'],
          ctaPreference: 'Book an ENT consultation'
        }
      },
      {
        url: '/v1/generations/reel-script',
        generationType: 'reel_script',
        payload: {
          clinicId,
          title: 'Sinus care basics',
          specialty: 'ENT',
          tone: 'simple',
          keyPoints: ['Avoid ignoring persistent symptoms'],
          ctaPreference: 'Book an ENT consultation'
        }
      },
      {
        url: '/v1/generations/tone-rewrite',
        generationType: 'tone_rewrite',
        payload: {
          clinicId,
          content: 'Please consult early when symptoms persist.',
          tone: 'warm'
        }
      }
    ];

    for (const request of requests) {
      const response = await app.inject({
        method: 'POST',
        url: request.url,
        headers: { authorization: 'Bearer test-user-1' },
        payload: request.payload
      });

      expect(response.statusCode).toBe(200);
    }

    expect(generationStore.entries).toHaveLength(4);
    expect(generationStore.entries.map((entry) => entry.generationType)).toEqual(
      requests.map((request) => request.generationType)
    );
    expect(generationStore.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clinicId,
          userId: 'test-user-1',
          provider: 'fake',
          model: 'fake-draft-v1',
          status: 'succeeded'
        })
      ])
    );
  });

  it('records patient-data blocked generation attempts without using quota', async () => {
    const generationStore = new RecordingGenerationStore();
    const app = buildApp({ env, allowTestTokens: true, generationStore });

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
    expect(generationStore.reserveCalls).toBe(0);
    expect(generationStore.entries).toEqual([
      expect.objectContaining({
        generationType: 'content_item_caption',
        status: 'blocked',
        errorCategory: 'patient_data_rejected'
      })
    ]);
  });

  it('rejects generation when usage quota is exhausted and records a blocked attempt', async () => {
    const generationStore = new RecordingGenerationStore({ quotaAllowed: false });
    const app = buildApp({ env: { ...env, GENERATION_DAILY_LIMIT: '1' }, allowTestTokens: true, generationStore });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
        idempotencyKey: 'campaign-001',
        durationDays: 7,
        specialty: 'ENT',
        services: ['Ear infection care'],
        locality: 'Pune',
        goal: 'increase appointment enquiries',
        tone: 'simple',
        ctaPreference: 'Book an ENT consultation',
        disclaimerPreference: 'For general education only.'
      }
    });

    expect(response.statusCode).toBe(429);
    expect(response.json()).toMatchObject({
      ok: false,
      error: { code: 'quota_exceeded' }
    });
    expect(generationStore.reserveCalls).toBe(1);
    expect(generationStore.entries).toEqual([
      expect.objectContaining({
        generationType: 'campaign_plan',
        status: 'blocked',
        errorCategory: 'quota_exceeded'
      })
    ]);
  });
});

class RecordingGenerationStore {
  readonly entries: Array<Record<string, unknown>> = [];
  reserveCalls = 0;

  constructor(private readonly options: { quotaAllowed?: boolean } = {}) {}

  async reserveUsage() {
    this.reserveCalls += 1;
    return {
      allowed: this.options.quotaAllowed ?? true,
      usedCount: this.options.quotaAllowed === false ? 1 : 0,
      limitCount: 1
    };
  }

  async recordGeneration(entry: Record<string, unknown>) {
    this.entries.push(entry);
  }
}

class RecordingComplianceReviewStore {
  readonly entries: Array<Record<string, unknown>> = [];

  async recordReview(entry: Record<string, unknown>) {
    this.entries.push(entry);
  }
}
