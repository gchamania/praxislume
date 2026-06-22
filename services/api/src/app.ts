import cors from '@fastify/cors';
import Fastify from 'fastify';
import { nanoid } from 'nanoid';
import {
  campaignPlanRequestSchema,
  captionGenerationRequestSchema,
  complianceReviewRequestSchema,
  patientDataGuard,
  reelScriptRequestSchema,
  toneRewriteRequestSchema
} from '@praxislume/contracts';
import { authenticateRequest } from './auth.js';
import { reviewCompliance } from './compliance.js';
import { loadConfig } from './config.js';
import { sendError, sendOk } from './envelope.js';
import { FakeProvider } from './fakeProvider.js';
import { InMemoryGenerationLog } from './generationLog.js';

type BuildAppOptions = {
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  allowTestTokens?: boolean;
};

function ensureNoPatientData(input: unknown) {
  return patientDataGuard(input);
}

export function buildApp(options: BuildAppOptions = {}) {
  const config = loadConfig(options.env ?? process.env);
  const provider = new FakeProvider(config.DEFAULT_DRAFT_MODEL);
  const generationLog = new InMemoryGenerationLog();
  const app = Fastify({
    genReqId: () => `req_${nanoid(10)}`,
    logger:
      config.NODE_ENV === 'test'
        ? false
        : {
            redact: ['req.headers.authorization', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY']
          }
  });

  app.decorate('generationLog', generationLog);
  app.register(cors, { origin: true });

  app.get('/health', async (request, reply) => {
    return sendOk(reply, request, { status: 'ok' });
  });

  app.get('/ready', async (request, reply) => {
    return sendOk(reply, request, { status: 'ready', provider: provider.providerName() });
  });

  app.post(
    '/v1/generations/campaign-plan',
    { preHandler: authenticateRequest(options.allowTestTokens) },
    async (request, reply) => {
      const parsed = campaignPlanRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }

      const patientGuard = ensureNoPatientData(parsed.data);
      if (!patientGuard.ok) {
        return sendError(reply, request, 400, 'patient_data_rejected', 'Patient-identifiable data is not allowed in generation requests');
      }

      const start = Date.now();
      const data = provider.generateCampaignPlan(parsed.data);
      generationLog.record({
        clinicId: parsed.data.clinicId,
        userId: request.auth?.userId ?? 'unknown',
        generationType: 'campaign_plan',
        provider: provider.providerName(),
        model: provider.modelName(),
        status: 'succeeded',
        latencyMs: Date.now() - start,
        requestId: String(request.id)
      });

      return sendOk(reply, request, data);
    }
  );

  app.post(
    '/v1/generations/content-item-caption',
    { preHandler: authenticateRequest(options.allowTestTokens) },
    async (request, reply) => {
      const parsed = captionGenerationRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }
      const patientGuard = ensureNoPatientData(parsed.data);
      if (!patientGuard.ok) {
        return sendError(reply, request, 400, 'patient_data_rejected', 'Patient-identifiable data is not allowed in generation requests');
      }
      return sendOk(reply, request, provider.generateCaption(parsed.data));
    }
  );

  app.post(
    '/v1/generations/reel-script',
    { preHandler: authenticateRequest(options.allowTestTokens) },
    async (request, reply) => {
      const parsed = reelScriptRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }
      const patientGuard = ensureNoPatientData(parsed.data);
      if (!patientGuard.ok) {
        return sendError(reply, request, 400, 'patient_data_rejected', 'Patient-identifiable data is not allowed in generation requests');
      }
      return sendOk(reply, request, provider.generateReelScript(parsed.data));
    }
  );

  app.post(
    '/v1/generations/tone-rewrite',
    { preHandler: authenticateRequest(options.allowTestTokens) },
    async (request, reply) => {
      const parsed = toneRewriteRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
      }
      const patientGuard = ensureNoPatientData(parsed.data);
      if (!patientGuard.ok) {
        return sendError(reply, request, 400, 'patient_data_rejected', 'Patient-identifiable data is not allowed in generation requests');
      }
      return sendOk(reply, request, provider.rewriteTone(parsed.data));
    }
  );

  app.post('/v1/compliance/review', { preHandler: authenticateRequest(options.allowTestTokens) }, async (request, reply) => {
    const parsed = complianceReviewRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, request, 400, 'validation_error', 'Request validation failed');
    }
    return sendOk(reply, request, reviewCompliance(parsed.data.content, parsed.data.contentVersionHash));
  });

  return app;
}
