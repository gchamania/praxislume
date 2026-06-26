import cors from '@fastify/cors';
import Fastify from 'fastify';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import {
  campaignPlanRequestSchema,
  captionGenerationRequestSchema,
  complianceReviewRequestSchema,
  patientDataGuard,
  reelScriptRequestSchema,
  toneRewriteRequestSchema,
  visualAssetGenerationRequestSchema,
  type VisualAssetGenerationRequest,
  type VisualAssetGenerationResponse,
  type VisualAssetPngExportResponse
} from '@praxislume/contracts';
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
import {
  buildVisualBrief,
  createVisualAssetProviderRouter,
  VisualAssetProviderError,
  type VisualAssetProviderMetadata,
  type VisualAssetProviderRouter
} from './visualAssetProvider.js';
import {
  InMemoryVisualAssetStore,
  SupabaseVisualAssetStore,
  type VisualAssetStore
} from './visualAssetStore.js';
import { renderBrandedPostSvg } from './visualRenderer.js';
import { renderSvgToPng } from './visualPngRenderer.js';

const latestVisualAssetQuerySchema = z.object({
  clinicId: z.string().uuid(),
  contentItemId: z.string().uuid()
});

const visualAssetParamsSchema = z.object({
  assetId: z.string().uuid()
});

type BuildAppOptions = {
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  allowTestTokens?: boolean;
  generationStore?: GenerationStore;
  complianceStore?: ComplianceReviewStore;
  visualAssetStore?: VisualAssetStore;
  tokenVerifier?: AuthTokenVerifier;
};

function ensureNoPatientData(input: unknown) {
  return patientDataGuard(input);
}

export function buildApp(options: BuildAppOptions = {}) {
  const config = loadConfig(options.env ?? process.env);
  const provider = createGenerationProviderRouter(config);
  const visualProvider = createVisualAssetProviderRouter(config);
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
  const visualAssetStore =
    options.visualAssetStore ??
    (config.NODE_ENV === 'test' ? new InMemoryVisualAssetStore() : new SupabaseVisualAssetStore(config));
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
        visualProvider,
        visualAssetStore,
        input: parsed.data
      });
    }
  );

  app.post(
    '/v1/generations/visual-asset/:assetId/png-export',
    { preHandler: authPreHandler },
    async (request, reply) => {
      const parsed = visualAssetParamsSchema.safeParse(request.params);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }

      const sourceAsset = await visualAssetStore.brandedAssetForExport({
        assetId: parsed.data.assetId,
        userId: request.auth?.userId ?? ''
      });
      if (!sourceAsset) {
        return sendError(reply, request, 403, 'forbidden', 'Visual asset export is not available');
      }

      const source = await visualAssetStore.downloadGeneratedAsset(sourceAsset.storagePath);
      if (!source || source.mimeType !== 'image/svg+xml') {
        return sendError(reply, request, 500, 'internal_error', 'Generated visual asset source is unavailable');
      }

      const png = renderSvgToPng({
        svgBytes: source.bytes,
        width: sourceAsset.width,
        height: sourceAsset.height
      });
      const stored = await visualAssetStore.savePngExport({
        sourceAsset,
        bytes: png.bytes,
        width: png.width,
        height: png.height,
        metadata: {
          sourceMimeType: source.mimeType,
          sourceStoragePath: sourceAsset.storagePath
        }
      });
      const response: VisualAssetPngExportResponse = {
        assetId: stored.assetId,
        sourceAssetId: stored.sourceAssetId,
        storagePath: stored.storagePath,
        mimeType: stored.mimeType,
        width: stored.width,
        height: stored.height,
        signedUrl: stored.signedUrl,
        expiresInSeconds: stored.expiresInSeconds
      };
      return sendOk(reply, request, response);
    }
  );

  app.get(
    '/v1/generations/visual-asset/latest',
    { preHandler: authPreHandler },
    async (request, reply) => {
      const parsed = latestVisualAssetQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }

      const latest = await visualAssetStore.latestBrandedAsset({
        clinicId: parsed.data.clinicId,
        contentItemId: parsed.data.contentItemId,
        userId: request.auth?.userId ?? ''
      });
      return sendOk(reply, request, latest ?? null);
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

type RunVisualAssetOptions = {
  request: Parameters<typeof sendOk>[1];
  reply: Parameters<typeof sendOk>[0];
  config: ReturnType<typeof loadConfig>;
  generationStore: GenerationStore;
  visualProvider: VisualAssetProviderRouter;
  visualAssetStore: VisualAssetStore;
  input: VisualAssetGenerationRequest;
};

async function runVisualAssetGeneration({
  request,
  reply,
  config,
  generationStore,
  visualProvider,
  visualAssetStore,
  input
}: RunVisualAssetOptions) {
  const start = Date.now();
  const userId = request.auth?.userId ?? 'unknown';
  const requestId = String(request.id);
  const providerInfo = visualProvider.providerInfo();
  const inputSummary = visualAssetInputSummary(input);

  if (!config.IMAGE_GENERATION_ENABLED) {
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType: 'visual_asset',
      ...visualLogMetadata(providerInfo),
      status: 'blocked',
      errorCategory: 'feature_disabled',
      latencyMs: Date.now() - start,
      requestId,
      inputSummary
    });
    return sendError(reply, request, 400, 'feature_disabled', 'Visual asset generation is disabled');
  }

  const guard = ensureNoPatientData(input);
  if (!guard.ok) {
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType: 'visual_asset',
      ...visualLogMetadata(providerInfo),
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
    generationType: 'visual_asset',
    limitCount: config.IMAGE_GENERATION_DAILY_LIMIT
  });
  if (!usage.allowed) {
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType: 'visual_asset',
      ...visualLogMetadata(providerInfo),
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
    const brief = buildVisualBrief(input);
    const background = await visualProvider.generateBackground(input, brief);
    const logo = await visualAssetStore.downloadLogo(input.clinicId, input.logoPath);
    const rendered = renderBrandedPostSvg({
      request: input,
      backgroundBytes: background.bytes,
      backgroundMimeType: background.mimeType,
      logo
    });
    const stored = await visualAssetStore.saveAsset({
      clinicId: input.clinicId,
      contentItemId: input.contentItemId,
      assetType: 'branded_post_asset',
      bytes: rendered.bytes,
      mimeType: rendered.mimeType,
      width: rendered.width,
      height: rendered.height,
      metadata: {
        visualStyle: input.visualStyle,
        category: input.category,
        providerPromptHash: background.promptHash,
        backgroundProvider: background.provider,
        backgroundMimeType: background.mimeType,
        promptVersion: background.promptVersion
      }
    });
    const response: VisualAssetGenerationResponse = {
      assetId: stored.assetId,
      storagePath: stored.storagePath,
      mimeType: rendered.mimeType,
      width: rendered.width,
      height: rendered.height,
      signedUrl: stored.signedUrl,
      expiresInSeconds: stored.expiresInSeconds
    };

    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType: 'visual_asset',
      ...visualLogMetadata(background),
      status: 'succeeded',
      latencyMs: Date.now() - start,
      requestId,
      inputSummary,
      structuredOutput: {
        assetId: response.assetId,
        storagePath: response.storagePath,
        mimeType: response.mimeType,
        width: response.width,
        height: response.height
      },
      outputReferenceId: response.assetId
    });
    return sendOk(reply, request, response);
  } catch (error) {
    const errorCategory = error instanceof VisualAssetProviderError ? error.category : 'provider_error';
    const failureMetadata =
      error instanceof VisualAssetProviderError && error.metadata
        ? { ...providerInfo, ...error.metadata }
        : providerInfo;
    await generationStore.recordGeneration({
      clinicId: input.clinicId,
      userId,
      generationType: 'visual_asset',
      ...visualLogMetadata(failureMetadata),
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
      errorCategory === 'provider_timeout' ? 'Visual asset provider timed out' : 'Visual asset provider failed'
    );
  }
}

function visualAssetInputSummary(input: VisualAssetGenerationRequest) {
  return {
    contentItemId: input.contentItemId,
    specialty: input.specialty,
    category: input.category,
    tone: input.tone,
    visualStyle: input.visualStyle,
    hasLogoPath: Boolean(input.logoPath)
  };
}

function visualLogMetadata(metadata: Partial<VisualAssetProviderMetadata>) {
  return {
    provider: metadata.provider ?? 'fake',
    model: metadata.model ?? 'fake-image-v1',
    promptVersion: metadata.promptVersion,
    promptHash: metadata.promptHash
  };
}
