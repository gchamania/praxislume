import { afterEach, describe, expect, it, vi } from 'vitest';
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

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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

  it('uses an OpenAI-compatible campaign provider and records token metadata', async () => {
    const generationStore = new RecordingGenerationStore();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [campaignPlanItem({ dayOffset: 0, title: 'Live ENT plan item' })]
              })
            }
          }
        ],
        usage: { prompt_tokens: 111, completion_tokens: 222 }
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const app = buildApp({
      env: {
        ...env,
        CAMPAIGN_PLAN_PROVIDER: 'openai_compatible',
        OPENAI_COMPATIBLE_BASE_URL: 'https://gateway.example.test/v1',
        OPENAI_COMPATIBLE_API_KEY: 'server-only-test-key',
        OPENAI_COMPATIBLE_CAMPAIGN_MODEL: 'clinic-campaign-model'
      },
      allowTestTokens: true,
      generationStore
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
        idempotencyKey: 'campaign-live-001',
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
    expect(response.json().data.items[0].title).toBe('Live ENT plan item');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://gateway.example.test/v1/chat/completions');
    expect(request.headers.authorization).toBe('Bearer server-only-test-key');
    const body = JSON.parse(request.body);
    expect(body).toMatchObject({
      model: 'clinic-campaign-model',
      response_format: { type: 'json_object' }
    });
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        generationType: 'campaign_plan',
        provider: 'openai_compatible',
        model: 'clinic-campaign-model',
        status: 'succeeded',
        promptTokens: 111,
        completionTokens: 222
      })
    );
    expect(generationStore.entries[0].promptVersion).toMatch(/^campaign_plan:/);
    expect(generationStore.entries[0].promptHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('adds DeepSeek request controls to OpenAI-compatible text calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [campaignPlanItem({ dayOffset: 0, title: 'DeepSeek ENT plan item' })]
              })
            }
          }
        ],
        usage: { prompt_tokens: 121, completion_tokens: 242 }
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const app = buildApp({
      env: {
        ...env,
        CAMPAIGN_PLAN_PROVIDER: 'openai_compatible',
        OPENAI_COMPATIBLE_BASE_URL: 'https://api.deepseek.com',
        OPENAI_COMPATIBLE_API_KEY: 'server-only-deepseek-key',
        OPENAI_COMPATIBLE_CAMPAIGN_MODEL: 'deepseek-v4-pro',
        OPENAI_COMPATIBLE_THINKING: 'disabled',
        OPENAI_COMPATIBLE_REASONING_EFFORT: 'high'
      },
      allowTestTokens: true
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer test-user-1' },
      payload: liveCampaignPayload()
    });

    expect(response.statusCode).toBe(200);
    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request.body)).toMatchObject({
      model: 'deepseek-v4-pro',
      thinking: { type: 'disabled' },
      reasoning_effort: 'high',
      response_format: { type: 'json_object' }
    });
  });

  it('rejects visual asset generation while the image pilot is disabled and logs the blocked attempt', async () => {
    const generationStore = new RecordingGenerationStore();
    const app = buildApp({ env, allowTestTokens: true, generationStore });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/visual-asset',
      headers: { authorization: 'Bearer test-user-1' },
      payload: visualAssetPayload()
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      ok: false,
      error: { code: 'forbidden', message: 'Image generation is disabled' }
    });
    expect(generationStore.reserveCalls).toBe(0);
    expect(generationStore.entries).toEqual([
      expect.objectContaining({
        generationType: 'visual_asset',
        provider: 'fake',
        status: 'blocked',
        errorCategory: 'feature_disabled'
      })
    ]);
  });

  it('stores fake visual assets and records output references when the image pilot is enabled', async () => {
    const generationStore = new RecordingGenerationStore();
    const assetStore = new RecordingGeneratedAssetStore();
    const app = buildApp({
      env: {
        ...env,
        IMAGE_GENERATION_ENABLED: 'true',
        IMAGE_PROVIDER: 'fake',
        IMAGE_COMPATIBLE_MODEL: 'fake-image-v1'
      },
      allowTestTokens: true,
      generationStore,
      assetStore
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/visual-asset',
      headers: { authorization: 'Bearer test-user-1' },
      payload: visualAssetPayload()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toMatchObject({
      assetId: '33333333-3333-4333-8333-333333333333',
      mimeType: 'image/png',
      width: 1024,
      height: 1024,
      signedUrl: 'https://storage.example.test/signed/asset.png',
      expiresInSeconds: 300
    });
    expect(response.json().data.storagePath).toMatch(
      /^8a66fd06-dadc-4bdb-966a-2c701f74a287\/assets\/11111111-1111-4111-8111-111111111111-thumbnail\.png$/
    );
    expect(assetStore.entries[0]).toEqual(
      expect.objectContaining({
        clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
        contentItemId: '11111111-1111-4111-8111-111111111111',
        assetType: 'ai_generated_thumbnail',
        mimeType: 'image/png'
      })
    );
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        generationType: 'visual_asset',
        provider: 'fake',
        model: 'fake-image-v1',
        status: 'succeeded',
        outputReferenceId: '33333333-3333-4333-8333-333333333333'
      })
    );
  });

  it('rejects patient-identifiable visual asset inputs before quota or provider calls', async () => {
    const generationStore = new RecordingGenerationStore();
    const app = buildApp({
      env: { ...env, IMAGE_GENERATION_ENABLED: 'true', IMAGE_PROVIDER: 'fake' },
      allowTestTokens: true,
      generationStore
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/visual-asset',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        ...visualAssetPayload(),
        title: 'Patient phone 9876543210 before and after'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(generationStore.reserveCalls).toBe(0);
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        generationType: 'visual_asset',
        status: 'blocked',
        errorCategory: 'patient_data_rejected'
      })
    );
  });

  it('rejects before-after visual asset requests before quota or provider calls', async () => {
    const generationStore = new RecordingGenerationStore();
    const app = buildApp({
      env: { ...env, IMAGE_GENERATION_ENABLED: 'true', IMAGE_PROVIDER: 'fake' },
      allowTestTokens: true,
      generationStore
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/visual-asset',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        ...visualAssetPayload(),
        title: 'Before and after acne treatment'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(generationStore.reserveCalls).toBe(0);
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        generationType: 'visual_asset',
        status: 'blocked',
        errorCategory: 'patient_data_rejected'
      })
    );
  });

  it('rejects visual asset generation when quota is exhausted before provider calls', async () => {
    const generationStore = new RecordingGenerationStore({ quotaAllowed: false });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const app = buildApp({
      env: liveImageEnv(),
      allowTestTokens: true,
      generationStore
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/visual-asset',
      headers: { authorization: 'Bearer test-user-1' },
      payload: visualAssetPayload()
    });

    expect(response.statusCode).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        generationType: 'visual_asset',
        provider: 'openai_compatible',
        status: 'blocked',
        errorCategory: 'quota_exceeded'
      })
    );
  });

  it('records visual asset provider failures without returning provider internals', async () => {
    const generationStore = new RecordingGenerationStore();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'image provider exploded' } }, 500)));
    const app = buildApp({
      env: liveImageEnv(),
      allowTestTokens: true,
      generationStore,
      assetStore: new RecordingGeneratedAssetStore()
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/visual-asset',
      headers: { authorization: 'Bearer test-user-1' },
      payload: visualAssetPayload()
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({
      ok: false,
      error: { code: 'provider_error', message: 'Generation provider failed' }
    });
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        generationType: 'visual_asset',
        provider: 'openai_compatible',
        model: 'deepseek-image-pilot',
        status: 'failed',
        errorCategory: 'provider_error'
      })
    );
  });

  it('maps visual asset provider timeouts to provider_timeout', async () => {
    const generationStore = new RecordingGenerationStore();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('aborted upstream'), { name: 'AbortError' })));
    const app = buildApp({
      env: liveImageEnv(),
      allowTestTokens: true,
      generationStore,
      assetStore: new RecordingGeneratedAssetStore()
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/visual-asset',
      headers: { authorization: 'Bearer test-user-1' },
      payload: visualAssetPayload()
    });

    expect(response.statusCode).toBe(504);
    expect(response.json()).toMatchObject({
      ok: false,
      error: { code: 'provider_timeout', message: 'Generation provider timed out' }
    });
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        generationType: 'visual_asset',
        provider: 'openai_compatible',
        status: 'failed',
        errorCategory: 'provider_timeout'
      })
    );
  });

  it('repairs invalid OpenAI-compatible campaign JSON once before succeeding', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [{ message: { content: '{not valid json' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  items: [campaignPlanItem({ dayOffset: 0, title: 'Repaired plan item' })]
                })
              }
            }
          ],
          usage: { prompt_tokens: 20, completion_tokens: 8 }
        })
      );
    vi.stubGlobal('fetch', fetchMock);
    const app = buildApp({
      env: {
        ...env,
        CAMPAIGN_PLAN_PROVIDER: 'openai_compatible',
        OPENAI_COMPATIBLE_BASE_URL: 'https://gateway.example.test',
        OPENAI_COMPATIBLE_API_KEY: 'server-only-test-key',
        OPENAI_COMPATIBLE_CAMPAIGN_MODEL: 'clinic-campaign-model'
      },
      allowTestTokens: true
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
        idempotencyKey: 'campaign-repair-001',
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
    expect(response.json().data.items[0].title).toBe('Repaired plan item');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const repairBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(repairBody.messages.at(-1).content).toContain('Repair the previous output');
  });

  it('records OpenAI-compatible provider errors without returning provider internals', async () => {
    const generationStore = new RecordingGenerationStore();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'upstream exploded' } }, 500)));
    const app = buildApp({
      env: {
        ...env,
        CAMPAIGN_PLAN_PROVIDER: 'openai_compatible',
        OPENAI_COMPATIBLE_BASE_URL: 'https://gateway.example.test',
        OPENAI_COMPATIBLE_API_KEY: 'server-only-test-key',
        OPENAI_COMPATIBLE_CAMPAIGN_MODEL: 'clinic-campaign-model'
      },
      allowTestTokens: true,
      generationStore
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
        idempotencyKey: 'campaign-error-001',
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

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({
      ok: false,
      error: { code: 'provider_error', message: 'Generation provider failed' }
    });
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        provider: 'openai_compatible',
        model: 'clinic-campaign-model',
        status: 'failed',
        errorCategory: 'provider_error'
      })
    );
    expect(generationStore.entries[0].promptVersion).toMatch(/^campaign_plan:/);
    expect(generationStore.entries[0].promptHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('maps OpenAI-compatible timeouts to provider_timeout without leaking internals', async () => {
    const generationStore = new RecordingGenerationStore();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('aborted upstream'), { name: 'AbortError' })));
    const app = buildApp({
      env: {
        ...env,
        CAMPAIGN_PLAN_PROVIDER: 'openai_compatible',
        OPENAI_COMPATIBLE_BASE_URL: 'https://gateway.example.test',
        OPENAI_COMPATIBLE_API_KEY: 'server-only-test-key',
        OPENAI_COMPATIBLE_CAMPAIGN_MODEL: 'clinic-campaign-model'
      },
      allowTestTokens: true,
      generationStore
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer test-user-1' },
      payload: liveCampaignPayload()
    });

    expect(response.statusCode).toBe(504);
    expect(response.json()).toMatchObject({
      ok: false,
      error: { code: 'provider_timeout', message: 'Generation provider timed out' }
    });
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        provider: 'openai_compatible',
        model: 'clinic-campaign-model',
        status: 'failed',
        errorCategory: 'provider_timeout'
      })
    );
    expect(generationStore.entries[0].promptHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('fails OpenAI-compatible output after one repair when schema remains invalid', async () => {
    const generationStore = new RecordingGenerationStore();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: JSON.stringify({ items: [] }) } }],
        usage: { prompt_tokens: 10, completion_tokens: 4 }
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const app = buildApp({
      env: {
        ...env,
        CAMPAIGN_PLAN_PROVIDER: 'openai_compatible',
        OPENAI_COMPATIBLE_BASE_URL: 'https://gateway.example.test',
        OPENAI_COMPATIBLE_API_KEY: 'server-only-test-key',
        OPENAI_COMPATIBLE_CAMPAIGN_MODEL: 'clinic-campaign-model'
      },
      allowTestTokens: true,
      generationStore
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer test-user-1' },
      payload: liveCampaignPayload()
    });

    expect(response.statusCode).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        provider: 'openai_compatible',
        model: 'clinic-campaign-model',
        status: 'failed',
        errorCategory: 'provider_error'
      })
    );
    expect(generationStore.entries[0].promptVersion).toMatch(/^campaign_plan:/);
    expect(generationStore.entries[0].promptHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects live campaign generation when quota is exhausted before provider calls', async () => {
    const generationStore = new RecordingGenerationStore({ quotaAllowed: false });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const app = buildApp({
      env: {
        ...env,
        CAMPAIGN_PLAN_PROVIDER: 'openai_compatible',
        OPENAI_COMPATIBLE_BASE_URL: 'https://gateway.example.test',
        OPENAI_COMPATIBLE_API_KEY: 'server-only-test-key',
        OPENAI_COMPATIBLE_CAMPAIGN_MODEL: 'clinic-campaign-model'
      },
      allowTestTokens: true,
      generationStore
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer test-user-1' },
      payload: liveCampaignPayload()
    });

    expect(response.statusCode).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(generationStore.entries[0]).toEqual(
      expect.objectContaining({
        provider: 'openai_compatible',
        model: 'clinic-campaign-model',
        status: 'blocked',
        errorCategory: 'quota_exceeded'
      })
    );
  });

  it.each(['ENT', 'Dermatology'])('accepts safe 30-day %s campaign quality fixtures', async (specialty) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          choices: [{ message: { content: JSON.stringify({ items: qualityCampaignItems(specialty) }) } }],
          usage: { prompt_tokens: 300, completion_tokens: 600 }
        })
      )
    );
    const app = buildApp({
      env: {
        ...env,
        CAMPAIGN_PLAN_PROVIDER: 'openai_compatible',
        OPENAI_COMPATIBLE_BASE_URL: 'https://gateway.example.test',
        OPENAI_COMPATIBLE_API_KEY: 'server-only-test-key',
        OPENAI_COMPATIBLE_CAMPAIGN_MODEL: 'clinic-campaign-model'
      },
      allowTestTokens: true
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/generations/campaign-plan',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        ...liveCampaignPayload(),
        durationDays: 30,
        specialty,
        services: specialty === 'ENT' ? ['Sinus consultation'] : ['Acne consultation']
      }
    });

    expect(response.statusCode).toBe(200);
    const items = response.json().data.items;
    expect(items).toHaveLength(30);
    for (const item of items) {
      expect(validContentCategories).toContain(item.category);
      expect(item.shortCta).toMatch(/Book|Schedule|Consult/i);
      expect(item.disclaimerNeeded).toBe(true);
      expect(JSON.stringify(item)).not.toMatch(
        /\b(?:guarantee|cure|best clinic|patient named|my patient|blood report|medical record|before and after)\b/i
      );
    }
  });

  it('uses OpenAI-compatible copy providers independently by route', async () => {
    const generationStore = new RecordingGenerationStore();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  caption: 'Live caption',
                  shortCta: 'Book an ENT consultation',
                  disclaimerNeeded: true
                })
              }
            }
          ],
          usage: { prompt_tokens: 31, completion_tokens: 17 }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  reelHook: 'Live hook',
                  reelScript: 'Live reel script',
                  shortCta: 'Book an ENT consultation'
                })
              }
            }
          ],
          usage: { prompt_tokens: 41, completion_tokens: 19 }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({ rewrittenContent: 'Live rewritten content' })
              }
            }
          ],
          usage: { prompt_tokens: 12, completion_tokens: 9 }
        })
      );
    vi.stubGlobal('fetch', fetchMock);
    const app = buildApp({
      env: {
        ...env,
        CAPTION_PROVIDER: 'openai_compatible',
        REEL_SCRIPT_PROVIDER: 'openai_compatible',
        TONE_REWRITE_PROVIDER: 'openai_compatible',
        OPENAI_COMPATIBLE_BASE_URL: 'https://gateway.example.test',
        OPENAI_COMPATIBLE_API_KEY: 'server-only-test-key',
        OPENAI_COMPATIBLE_COPY_MODEL: 'clinic-copy-model'
      },
      allowTestTokens: true,
      generationStore
    });
    const clinicId = '8a66fd06-dadc-4bdb-966a-2c701f74a287';

    const caption = await app.inject({
      method: 'POST',
      url: '/v1/generations/content-item-caption',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        clinicId,
        title: 'Sinus awareness',
        specialty: 'ENT',
        tone: 'warm',
        keyPoints: ['Know common warning signs'],
        ctaPreference: 'Book an ENT consultation',
        disclaimerPreference: 'For general education only.'
      }
    });
    const reel = await app.inject({
      method: 'POST',
      url: '/v1/generations/reel-script',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        clinicId,
        title: 'Sinus awareness',
        specialty: 'ENT',
        tone: 'warm',
        keyPoints: ['Know common warning signs'],
        ctaPreference: 'Book an ENT consultation'
      }
    });
    const rewrite = await app.inject({
      method: 'POST',
      url: '/v1/generations/tone-rewrite',
      headers: { authorization: 'Bearer test-user-1' },
      payload: {
        clinicId,
        content: 'Please consult early when symptoms persist.',
        tone: 'warm'
      }
    });

    expect(caption.json().data.caption).toBe('Live caption');
    expect(reel.json().data.reelScript).toBe('Live reel script');
    expect(rewrite.json().data.rewrittenContent).toBe('Live rewritten content');
    expect(generationStore.entries.map((entry) => entry.model)).toEqual([
      'clinic-copy-model',
      'clinic-copy-model',
      'clinic-copy-model'
    ]);
  });

  it('rejects patient-identifiable copy input before calling OpenAI-compatible provider', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const app = buildApp({
      env: {
        ...env,
        CAPTION_PROVIDER: 'openai_compatible',
        OPENAI_COMPATIBLE_BASE_URL: 'https://gateway.example.test',
        OPENAI_COMPATIBLE_API_KEY: 'server-only-test-key',
        OPENAI_COMPATIBLE_COPY_MODEL: 'clinic-copy-model'
      },
      allowTestTokens: true
    });

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
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

const validContentCategories = [
  'awareness',
  'myth_buster',
  'symptoms',
  'procedure_explainer',
  'seasonal_health_tip',
  'clinic_service',
  'faq'
];

function liveCampaignPayload() {
  return {
    clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
    idempotencyKey: 'campaign-live-default',
    durationDays: 7,
    specialty: 'ENT',
    services: ['Ear infection care'],
    locality: 'Pune',
    goal: 'increase appointment enquiries',
    tone: 'simple',
    ctaPreference: 'Book an ENT consultation',
    disclaimerPreference: 'For general education only.'
  };
}

function visualAssetPayload() {
  return {
    clinicId: '8a66fd06-dadc-4bdb-966a-2c701f74a287',
    contentItemId: '11111111-1111-4111-8111-111111111111',
    title: 'Sinus care basics',
    specialty: 'ENT',
    category: 'awareness',
    tone: 'simple',
    brandColors: {
      primary: '#0D4D57',
      accent: '#F2C15E'
    },
    visualStyle: 'clean_medical_abstract'
  };
}

function liveImageEnv() {
  return {
    ...env,
    IMAGE_GENERATION_ENABLED: 'true',
    IMAGE_PROVIDER: 'openai_compatible',
    IMAGE_COMPATIBLE_BASE_URL: 'https://images.example.test/v1',
    IMAGE_COMPATIBLE_API_KEY: 'server-only-image-key',
    IMAGE_COMPATIBLE_MODEL: 'deepseek-image-pilot'
  };
}

function qualityCampaignItems(specialty: string) {
  return Array.from({ length: 30 }, (_, index) => ({
    ...campaignPlanItem({
      dayOffset: index,
      title: `${specialty} education plan day ${index + 1}`
    }),
    shortCta: `Book a ${specialty} consultation`,
    hashtags: [`#${specialty.replace(/\s+/g, '')}`, '#ClinicEducation']
  }));
}

function campaignPlanItem(input: { dayOffset: number; title: string }) {
  return {
    dayOffset: input.dayOffset,
    title: input.title,
    category: 'awareness',
    objective: 'Educate local patients safely.',
    keyPoints: ['Common symptom context', 'Consult a qualified doctor'],
    caption: 'General education for local patients. Consult a qualified doctor for personal advice.',
    shortCta: 'Book an ENT consultation',
    hashtags: ['#ENT'],
    reelHook: 'Know when to consult.',
    reelScript: 'Explain symptoms and invite consultation.',
    disclaimerNeeded: true
  };
}

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  };
}

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

class RecordingGeneratedAssetStore {
  readonly entries: Array<Record<string, unknown>> = [];

  async saveVisualAsset(entry: Record<string, unknown>) {
    this.entries.push(entry);
    return {
      assetId: '33333333-3333-4333-8333-333333333333',
      storagePath: `${entry.clinicId}/assets/${entry.contentItemId}-thumbnail.png`,
      mimeType: entry.mimeType,
      width: entry.width,
      height: entry.height,
      signedUrl: 'https://storage.example.test/signed/asset.png',
      expiresInSeconds: 300
    };
  }
}

class RecordingComplianceReviewStore {
  readonly entries: Array<Record<string, unknown>> = [];

  async recordReview(entry: Record<string, unknown>) {
    this.entries.push(entry);
  }
}
