import cors from '@fastify/cors';
import Fastify from 'fastify';
import { nanoid } from 'nanoid';
import {
  campaignPlanRequestSchema,
  carouselGenerationRequestSchema,
  captionGenerationRequestSchema,
  complianceReviewRequestSchema,
  patientDataGuard,
  reelScriptRequestSchema,
  toneRewriteRequestSchema,
  visualAssetGenerationRequestSchema,
  type VisualAssetGenerationRequest
} from '@praxislume/contracts';
import {
  InMemoryGeneratedAssetStore,
  SupabaseGeneratedAssetStore,
  type GeneratedAssetStore
} from './assetStore.js';
import { authenticateRequest, createSupabaseTokenVerifier, type AuthTokenVerifier } from './auth.js';
import { reviewCompliance } from './compliance.js';
import {
  InMemoryComplianceReviewStore,
  SupabaseComplianceReviewStore,
  type ComplianceReviewStore
} from './complianceStore.js';
import { loadConfig } from './config.js';
import { sendError, sendOk } from './envelope.js';
import {
  createGenerationProviderRouter,
  ProviderGenerationError,
  type GenerationProviderMetadata,
  type GenerationProviderResult,
  type GenerationProviderRouter,
  type GenerationType
} from './generationProvider.js';
import {
  InMemoryGenerationStore,
  SupabaseGenerationStore,
  type GenerationStore
} from './generationLog.js';
import { VisualAssetProvider } from './visualAssetProvider.js';

type BuildAppOptions = {
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  allowTestTokens?: boolean;
  generationStore?: GenerationStore;
  complianceStore?: ComplianceReviewStore;
  assetStore?: GeneratedAssetStore;
  tokenVerifier?: AuthTokenVerifier;
};

function ensureNoPatientData(input: unknown) {
  return patientDataGuard(input);
}

export function buildApp(options: BuildAppOptions = {}) {
  const config = loadConfig(options.env ?? process.env);
  const provider = createGenerationProviderRouter(config);
  const generationStore =
    options.generationStore ??
    (config.NODE_ENV === 'test'
      ? new InMemoryGenerationStore(config.GENERATION_DAILY_LIMIT)
      : new SupabaseGenerationStore(config));
  const complianceStore =
    options.complianceStore ??
    (config.NODE_ENV === 'test'
      ? new InMemoryComplianceReviewStore()
      : new SupabaseComplianceReviewStore(config));
  const assetStore =
    options.assetStore ??
    (config.NODE_ENV === 'test' ? new InMemoryGeneratedAssetStore() : new SupabaseGeneratedAssetStore(config));
  const visualAssetProvider = new VisualAssetProvider(config);
  const tokenVerifier =
    options.tokenVerifier ?? (config.NODE_ENV === 'test' ? undefined : createSupabaseTokenVerifier(config));
  const authPreHandler = authenticateRequest({
    allowTestTokens: options.allowTestTokens,
    verifyToken: tokenVerifier
  });
  const app = Fastify({
    genReqId: () => `req_${nanoid(10)}`,
    logger:
      config.NODE_ENV === 'test'
        ? false
        : {
            redact: ['req.headers.authorization', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY']
          }
  });

  app.register(cors, { origin: true });

  app.get('/health', async (request, reply) => {
    return sendOk(reply, request, { status: 'ok' });
  });

  app.get('/ready', async (request, reply) => {
    return sendOk(reply, request, { status: 'ready', provider: provider.providerSummary() });
  });

  app.post(
    '/v1/generations/campaign-plan',
    { preHandler: authPreHandler },
    async (request, reply) => {
      const parsed = campaignPlanRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }

      return runGeneration({
        request,
        reply,
        generationStore,
        provider,
        generationType: 'campaign_plan',
        input: parsed.data,
        inputSummary: {
          durationDays: parsed.data.durationDays,
          specialty: parsed.data.specialty,
          servicesCount: parsed.data.services.length,
          locality: parsed.data.locality,
          tone: parsed.data.tone
        },
        generate: () => provider.generateCampaignPlan(parsed.data)
      });
    }
  );

  app.post(
    '/v1/generations/content-item-caption',
    { preHandler: authPreHandler },
    async (request, reply) => {
      const parsed = captionGenerationRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }
      const patientGuard = ensureNoPatientData(parsed.data);
      return runGeneration({
        request,
        reply,
        generationStore,
        provider,
        generationType: 'content_item_caption',
        input: parsed.data,
        patientGuard,
        inputSummary: {
          specialty: parsed.data.specialty,
          keyPointCount: parsed.data.keyPoints.length,
          tone: parsed.data.tone
        },
        generate: () => provider.generateCaption(parsed.data)
      });
    }
  );

  app.post(
    '/v1/generations/reel-script',
    { preHandler: authPreHandler },
    async (request, reply) => {
      const parsed = reelScriptRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }
      const patientGuard = ensureNoPatientData(parsed.data);
      return runGeneration({
        request,
        reply,
        generationStore,
        provider,
        generationType: 'reel_script',
        input: parsed.data,
        patientGuard,
        inputSummary: {
          specialty: parsed.data.specialty,
          keyPointCount: parsed.data.keyPoints.length,
          tone: parsed.data.tone
        },
        generate: () => provider.generateReelScript(parsed.data)
      });
    }
  );

  app.post(
    '/v1/generations/tone-rewrite',
    { preHandler: authPreHandler },
    async (request, reply) => {
      const parsed = toneRewriteRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }
      const patientGuard = ensureNoPatientData(parsed.data);
      return runGeneration({
        request,
        reply,
        generationStore,
        provider,
        generationType: 'tone_rewrite',
        input: parsed.data,
        patientGuard,
        inputSummary: {
          contentLength: parsed.data.content.length,
          tone: parsed.data.tone
        },
        generate: () => provider.rewriteTone(parsed.data)
      });
    }
  );

  app.post(
    '/v1/generations/carousel-slides',
    { preHandler: authPreHandler },
    async (request, reply) => {
      const parsed = carouselGenerationRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }
      const patientGuard = ensureNoPatientData(parsed.data);
      return runGeneration({
        request,
        reply,
        generationStore,
        provider,
        generationType: 'carousel_slides',
        input: parsed.data,
        patientGuard,
        inputSummary: {
          specialty: parsed.data.specialty,
          category: parsed.data.category,
          slideCount: parsed.data.slideCount,
          tone: parsed.data.tone,
          visualStyle: parsed.data.visualStyle,
          keyPointCount: parsed.data.keyPoints.length
        },
        generate: () => provider.generateCarouselSlides(parsed.data)
      });
    }
  );

  app.post(
    '/v1/generations/visual-asset',
    { preHandler: authPreHandler },
    async (request, reply) => {
      const parsed = visualAssetGenerationRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }

      return runVisualAssetGeneration({
        request,
        reply,
        config,
        generationStore,
        assetStore,
        visualAssetProvider,
        input: parsed.data,
        patientGuard: ensureNoPatientData(parsed.data)
      });
    }
  );

  app.post('/v1/compliance/review', { preHandler: authPreHandler }, async (request, reply) => {
    const parsed = complianceReviewRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
    }
    const review = reviewCompliance(parsed.data.content, parsed.data.contentVersionHash);
    await complianceStore.recordReview({
      clinicId: parsed.data.clinicId,
      reviewedContentVersionHash: review.reviewedContentVersionHash,
      status: review.status,
      issueCodes: review.issueCodes,
      notes: review.notes,
      saferRewrite: review.saferRewrite,
      reviewerType: 'rules'
    });
    return sendOk(reply, request, review);
  });

  return app;
}

type RunVisualAssetGenerationOptions = {
  request: Parameters<typeof sendOk>[1];
  reply: Parameters<typeof sendOk>[0];
  config: ReturnType<typeof loadConfig>;
  generationStore: GenerationStore;
  assetStore: GeneratedAssetStore;
  visualAssetProvider: VisualAssetProvider;
  input: VisualAssetGenerationRequest;
  patientGuard: ReturnType<typeof ensureNoPatientData>;
};

async function runVisualAssetGeneration({
  request,
  reply,
  config,
  generationStore,
  assetStore,
  visualAssetProvider,
  input,
  patientGuard
}: RunVisualAssetGenerationOptions) {
  const start = Date.now();
  const userId = request.auth?.userId ?? 'unknown';
  const requestId = String(request.id);
  const generationType = 'visual_asset';
  const providerInfo = visualAssetProvider.providerInfo();
  const inputSummary = {
    specialty: input.specialty,
    category: input.category,
    tone: input.tone,
    hasContentItemId: Boolean(input.contentItemId)
  };

  if (!patientGuard.ok) {
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType,
      ...logMetadata(providerInfo),
      status: 'blocked',
      errorCategory: 'patient_data_rejected',
      latencyMs: Date.now() - start,
      requestId,
      inputSummary: {
        ...inputSummary,
        rejectedIssueCodes: patientGuard.issueCodes
      }
    });
    return sendError(
      reply,
      request,
      400,
      'patient_data_rejected',
      'Patient-identifiable data is not allowed in generation requests'
    );
  }

  if (!config.IMAGE_GENERATION_ENABLED) {
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType,
      ...logMetadata(providerInfo),
      status: 'blocked',
      errorCategory: 'feature_disabled',
      latencyMs: Date.now() - start,
      requestId,
      inputSummary
    });
    return sendError(reply, request, 403, 'forbidden', 'Image generation is disabled');
  }

  const usage = await generationStore.reserveUsage({
    clinicId: input.clinicId,
    userId,
    generationType
  });
  if (!usage.allowed) {
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType,
      ...logMetadata(providerInfo),
      status: 'blocked',
      errorCategory: 'quota_exceeded',
      latencyMs: Date.now() - start,
      requestId,
      inputSummary: {
        ...inputSummary,
        usedCount: usage.usedCount,
        limitCount: usage.limitCount
      }
    });
    return sendError(reply, request, 429, 'quota_exceeded', 'Generation quota exhausted');
  }

  try {
    const result = await visualAssetProvider.generate(input);
    const asset = await assetStore.saveVisualAsset({
      clinicId: input.clinicId,
      contentItemId: input.contentItemId,
      requestId,
      assetType: 'ai_generated_thumbnail',
      bytes: result.bytes,
      mimeType: result.data.mimeType,
      width: result.data.width,
      height: result.data.height,
      metadata: {
        promptHash: result.promptHash,
        promptVersion: result.promptVersion
      }
    });
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType,
      ...logMetadata(result),
      status: 'succeeded',
      latencyMs: Date.now() - start,
      requestId,
      inputSummary,
      outputReferenceId: asset.assetId,
      structuredOutput: {
        assetId: asset.assetId,
        storagePath: asset.storagePath,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height
      }
    });
    return sendOk(reply, request, asset);
  } catch (error) {
    const errorCategory = error instanceof ProviderGenerationError ? error.category : 'provider_error';
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType,
      ...logMetadata(providerInfo),
      status: 'failed',
      errorCategory,
      latencyMs: Date.now() - start,
      requestId,
      inputSummary: {
        ...inputSummary,
        errorName: error instanceof Error ? error.name : 'UnknownError'
      }
    });
    return sendError(
      reply,
      request,
      errorCategory === 'provider_timeout' ? 504 : 502,
      errorCategory,
      errorCategory === 'provider_timeout' ? 'Generation provider timed out' : 'Generation provider failed'
    );
  }
}

type GenerationInput = {
  clinicId: string;
};

type RunGenerationOptions<TData> = {
  request: Parameters<typeof sendOk>[1];
  reply: Parameters<typeof sendOk>[0];
  generationStore: GenerationStore;
  provider: GenerationProviderRouter;
  generationType: GenerationType;
  input: GenerationInput;
  inputSummary: Record<string, unknown>;
  patientGuard?: ReturnType<typeof ensureNoPatientData>;
  generate: () => Promise<GenerationProviderResult<TData>>;
};

async function runGeneration<TData>({
  request,
  reply,
  generationStore,
  provider,
  generationType,
  input,
  inputSummary,
  patientGuard,
  generate
}: RunGenerationOptions<TData>) {
  const start = Date.now();
  const userId = request.auth?.userId ?? 'unknown';
  const requestId = String(request.id);
  const guard = patientGuard ?? ensureNoPatientData(input);
  const providerInfo = provider.providerInfo(generationType);

  if (!guard.ok) {
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType,
      ...logMetadata(providerInfo),
      status: 'blocked',
      errorCategory: 'patient_data_rejected',
      latencyMs: Date.now() - start,
      requestId,
      inputSummary: {
        ...inputSummary,
        rejectedIssueCodes: guard.issueCodes
      }
    });
    return sendError(
      reply,
      request,
      400,
      'patient_data_rejected',
      'Patient-identifiable data is not allowed in generation requests'
    );
  }

  const usage = await generationStore.reserveUsage({
    clinicId: input.clinicId,
    userId,
    generationType
  });
  if (!usage.allowed) {
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType,
      ...logMetadata(providerInfo),
      status: 'blocked',
      errorCategory: 'quota_exceeded',
      latencyMs: Date.now() - start,
      requestId,
      inputSummary: {
        ...inputSummary,
        usedCount: usage.usedCount,
        limitCount: usage.limitCount
      }
    });
    return sendError(reply, request, 429, 'quota_exceeded', 'Generation quota exhausted');
  }

  try {
    const result = await generate();
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType,
      ...logMetadata(result),
      status: 'succeeded',
      latencyMs: Date.now() - start,
      requestId,
      inputSummary,
      structuredOutput: result.data
    });
    return sendOk(reply, request, result.data);
  } catch (error) {
    const errorCategory = error instanceof ProviderGenerationError ? error.category : 'provider_error';
    const failureMetadata =
      error instanceof ProviderGenerationError && error.metadata ? { ...providerInfo, ...error.metadata } : providerInfo;
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType,
      ...logMetadata(failureMetadata),
      status: 'failed',
      errorCategory,
      latencyMs: Date.now() - start,
      requestId,
      inputSummary: {
        ...inputSummary,
        errorName: error instanceof Error ? error.name : 'UnknownError'
      }
    });
    return sendError(
      reply,
      request,
      errorCategory === 'provider_timeout' ? 504 : 502,
      errorCategory,
      errorCategory === 'provider_timeout' ? 'Generation provider timed out' : 'Generation provider failed'
    );
  }
}

function logMetadata(metadata: GenerationProviderMetadata) {
  return {
    provider: metadata.provider,
    model: metadata.model,
    promptVersion: metadata.promptVersion,
    promptHash: metadata.promptHash,
    promptTokens: metadata.promptTokens,
    completionTokens: metadata.completionTokens,
    estimatedCost: metadata.estimatedCost
  };
}
