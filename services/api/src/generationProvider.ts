import { createHash } from 'node:crypto';
import {
  campaignPlanResponseSchema,
  captionGenerationResponseSchema,
  reelScriptResponseSchema,
  toneRewriteResponseSchema,
  type CampaignPlanRequest,
  type CampaignPlanResponse,
  type CaptionGenerationRequest,
  type ReelScriptRequest,
  type ToneRewriteRequest
} from '@praxislume/contracts';
import { z, type ZodType } from 'zod';
import type { ApiConfig, GenerationProviderName } from './config.js';
import { FakeProvider } from './fakeProvider.js';

export type GenerationType = 'campaign_plan' | 'content_item_caption' | 'reel_script' | 'tone_rewrite';

export type GenerationProviderMetadata = {
  provider: GenerationProviderName;
  model: string;
  promptVersion?: string;
  promptHash?: string;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCost?: number;
};

export type GenerationProviderResult<TData> = GenerationProviderMetadata & {
  data: TData;
};

export class ProviderGenerationError extends Error {
  constructor(
    readonly category: 'provider_error' | 'provider_timeout',
    message = 'Generation provider failed',
    readonly metadata?: Partial<GenerationProviderMetadata>
  ) {
    super(message);
    this.name = 'ProviderGenerationError';
  }
}

export interface GenerationProviderRouter {
  providerSummary(): string;
  providerInfo(generationType: GenerationType): GenerationProviderMetadata;
  generateCampaignPlan(request: CampaignPlanRequest): Promise<GenerationProviderResult<CampaignPlanResponse>>;
  generateCaption(
    request: CaptionGenerationRequest
  ): Promise<GenerationProviderResult<z.infer<typeof captionGenerationResponseSchema>>>;
  generateReelScript(
    request: ReelScriptRequest
  ): Promise<GenerationProviderResult<z.infer<typeof reelScriptResponseSchema>>>;
  rewriteTone(
    request: ToneRewriteRequest
  ): Promise<GenerationProviderResult<z.infer<typeof toneRewriteResponseSchema>>>;
}

const promptVersions: Record<GenerationType, string> = {
  campaign_plan: 'campaign_plan:v1',
  content_item_caption: 'content_item_caption:v1',
  reel_script: 'reel_script:v1',
  tone_rewrite: 'tone_rewrite:v1'
};

export function createGenerationProviderRouter(config: ApiConfig): GenerationProviderRouter {
  return new ConfiguredGenerationProviderRouter(config);
}

class ConfiguredGenerationProviderRouter implements GenerationProviderRouter {
  private readonly fakeProvider: FakeProvider;
  private openAIProviderInstance?: OpenAICompatibleProvider;

  constructor(private readonly config: ApiConfig) {
    this.fakeProvider = new FakeProvider(config.DEFAULT_DRAFT_MODEL);
  }

  providerSummary() {
    const routeProviders = [
      this.routeProvider('campaign_plan'),
      this.routeProvider('content_item_caption'),
      this.routeProvider('reel_script'),
      this.routeProvider('tone_rewrite')
    ];
    return routeProviders.every((provider) => provider === routeProviders[0]) ? routeProviders[0] : 'mixed';
  }

  providerInfo(generationType: GenerationType): GenerationProviderMetadata {
    const provider = this.routeProvider(generationType);
    return {
      provider,
      model: provider === 'fake' ? this.fakeProvider.modelName() : this.openAIModel(generationType),
      promptVersion: provider === 'openai_compatible' ? promptVersions[generationType] : undefined
    };
  }

  async generateCampaignPlan(request: CampaignPlanRequest) {
    if (this.routeProvider('campaign_plan') === 'openai_compatible') {
      return this.openAIProvider().generateCampaignPlan(request);
    }

    return this.fakeResult('campaign_plan', request, this.fakeProvider.generateCampaignPlan(request));
  }

  async generateCaption(request: CaptionGenerationRequest) {
    if (this.routeProvider('content_item_caption') === 'openai_compatible') {
      return this.openAIProvider().generateCaption(request);
    }

    return this.fakeResult('content_item_caption', request, this.fakeProvider.generateCaption(request));
  }

  async generateReelScript(request: ReelScriptRequest) {
    if (this.routeProvider('reel_script') === 'openai_compatible') {
      return this.openAIProvider().generateReelScript(request);
    }

    return this.fakeResult('reel_script', request, this.fakeProvider.generateReelScript(request));
  }

  async rewriteTone(request: ToneRewriteRequest) {
    if (this.routeProvider('tone_rewrite') === 'openai_compatible') {
      return this.openAIProvider().rewriteTone(request);
    }

    return this.fakeResult('tone_rewrite', request, this.fakeProvider.rewriteTone(request));
  }

  private fakeResult<TData>(generationType: GenerationType, request: unknown, data: TData): GenerationProviderResult<TData> {
    const promptVersion = `${generationType}:fake-v1`;
    return {
      data,
      provider: 'fake',
      model: this.fakeProvider.modelName(),
      promptVersion,
      promptHash: hashPrompt({ generationType, promptVersion, provider: 'fake', request })
    };
  }

  private routeProvider(generationType: GenerationType): GenerationProviderName {
    switch (generationType) {
      case 'campaign_plan':
        return this.config.CAMPAIGN_PLAN_PROVIDER ?? this.config.AI_PROVIDER;
      case 'content_item_caption':
        return this.config.CAPTION_PROVIDER ?? this.config.AI_PROVIDER;
      case 'reel_script':
        return this.config.REEL_SCRIPT_PROVIDER ?? this.config.AI_PROVIDER;
      case 'tone_rewrite':
        return this.config.TONE_REWRITE_PROVIDER ?? this.config.AI_PROVIDER;
    }
  }

  private openAIModel(generationType: GenerationType) {
    if (generationType === 'campaign_plan') {
      return requiredConfig(this.config.OPENAI_COMPATIBLE_CAMPAIGN_MODEL, 'OPENAI_COMPATIBLE_CAMPAIGN_MODEL');
    }

    return requiredConfig(this.config.OPENAI_COMPATIBLE_COPY_MODEL, 'OPENAI_COMPATIBLE_COPY_MODEL');
  }

  private openAIProvider() {
    this.openAIProviderInstance ??= new OpenAICompatibleProvider(this.config);
    return this.openAIProviderInstance;
  }
}

class OpenAICompatibleProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ApiConfig) {
    this.baseUrl = requiredConfig(config.OPENAI_COMPATIBLE_BASE_URL, 'OPENAI_COMPATIBLE_BASE_URL').replace(/\/+$/, '');
    this.apiKey = requiredConfig(config.OPENAI_COMPATIBLE_API_KEY, 'OPENAI_COMPATIBLE_API_KEY');
  }

  generateCampaignPlan(request: CampaignPlanRequest) {
    return this.completeJson({
      generationType: 'campaign_plan',
      model: requiredConfig(this.config.OPENAI_COMPATIBLE_CAMPAIGN_MODEL, 'OPENAI_COMPATIBLE_CAMPAIGN_MODEL'),
      schema: campaignPlanResponseSchema,
      request,
      messages: [
        systemPrompt(),
        {
          role: 'user',
          content: [
            `Create a ${request.durationDays}-day PraxisLume campaign plan as JSON.`,
            `Specialty: ${request.specialty}`,
            `Clinic locality: ${request.locality}`,
            `Services: ${request.services.join(', ')}`,
            `Growth goal: ${request.goal}`,
            `Tone: ${request.tone}`,
            `CTA to use: ${request.ctaPreference}`,
            `Disclaimer preference: ${request.disclaimerPreference}`,
            'Return {"items":[...]} only. Use valid categories, safe patient-education language, short CTAs, and no patient-specific examples.'
          ].join('\n')
        }
      ]
    });
  }

  generateCaption(request: CaptionGenerationRequest) {
    return this.completeJson({
      generationType: 'content_item_caption',
      model: requiredConfig(this.config.OPENAI_COMPATIBLE_COPY_MODEL, 'OPENAI_COMPATIBLE_COPY_MODEL'),
      schema: captionGenerationResponseSchema,
      request,
      messages: [
        systemPrompt(),
        {
          role: 'user',
          content: [
            'Create one patient-education caption as JSON.',
            `Title: ${request.title}`,
            `Specialty: ${request.specialty}`,
            contextLine('Clinic locality', request.locality),
            contextLine('Services', request.services?.join(', ')),
            `Tone: ${request.tone}`,
            `Key points: ${request.keyPoints.join(' | ')}`,
            `CTA to use: ${request.ctaPreference}`,
            contextLine('Disclaimer preference', request.disclaimerPreference),
            'Return {"caption":"...","shortCta":"...","disclaimerNeeded":true|false} only.'
          ]
            .filter(Boolean)
            .join('\n')
        }
      ]
    });
  }

  generateReelScript(request: ReelScriptRequest) {
    return this.completeJson({
      generationType: 'reel_script',
      model: requiredConfig(this.config.OPENAI_COMPATIBLE_COPY_MODEL, 'OPENAI_COMPATIBLE_COPY_MODEL'),
      schema: reelScriptResponseSchema,
      request,
      messages: [
        systemPrompt(),
        {
          role: 'user',
          content: [
            'Create one short reel script as JSON.',
            `Title: ${request.title}`,
            `Specialty: ${request.specialty}`,
            contextLine('Clinic locality', request.locality),
            contextLine('Services', request.services?.join(', ')),
            `Tone: ${request.tone}`,
            `Key points: ${request.keyPoints.join(' | ')}`,
            `CTA to use: ${request.ctaPreference}`,
            contextLine('Disclaimer preference', request.disclaimerPreference),
            'Return {"reelHook":"...","reelScript":"...","shortCta":"..."} only.'
          ]
            .filter(Boolean)
            .join('\n')
        }
      ]
    });
  }

  rewriteTone(request: ToneRewriteRequest) {
    return this.completeJson({
      generationType: 'tone_rewrite',
      model: requiredConfig(this.config.OPENAI_COMPATIBLE_COPY_MODEL, 'OPENAI_COMPATIBLE_COPY_MODEL'),
      schema: toneRewriteResponseSchema,
      request,
      messages: [
        systemPrompt(),
        {
          role: 'user',
          content: [
            'Rewrite the content into the requested clinic brand tone as JSON.',
            `Tone: ${request.tone}`,
            contextLine('Specialty', request.specialty),
            contextLine('Clinic locality', request.locality),
            contextLine('Services', request.services?.join(', ')),
            contextLine('CTA preference', request.ctaPreference),
            contextLine('Disclaimer preference', request.disclaimerPreference),
            `Content: ${request.content}`,
            'Return {"rewrittenContent":"..."} only.'
          ]
            .filter(Boolean)
            .join('\n')
        }
      ]
    });
  }

  private async completeJson<TData>(input: {
    generationType: GenerationType;
    model: string;
    schema: ZodType<TData>;
    request: unknown;
    messages: ChatMessage[];
  }): Promise<GenerationProviderResult<TData>> {
    const promptVersion = promptVersions[input.generationType];
    const promptHash = hashPrompt({
      generationType: input.generationType,
      promptVersion,
      provider: 'openai_compatible',
      model: input.model,
      messages: input.messages,
      request: input.request
    });
    const metadata: GenerationProviderMetadata = {
      provider: 'openai_compatible',
      model: input.model,
      promptVersion,
      promptHash
    };

    try {
      const firstAttempt = await this.chatCompletion(input.model, input.messages);
      const firstParsed = parseProviderJson(firstAttempt.content, input.schema);

      if (firstParsed.ok) {
        return {
          data: firstParsed.data,
          ...metadata,
          promptTokens: firstAttempt.promptTokens,
          completionTokens: firstAttempt.completionTokens
        };
      }

      const repairedMessages: ChatMessage[] = [
        ...input.messages,
        { role: 'assistant', content: firstAttempt.content },
        {
          role: 'user',
          content:
            'Repair the previous output so it is strict JSON matching the requested schema. Return only a JSON object with no markdown.'
        }
      ];
      const repairAttempt = await this.chatCompletion(input.model, repairedMessages);
      const repairedParsed = parseProviderJson(repairAttempt.content, input.schema);

      if (!repairedParsed.ok) {
        throw new ProviderGenerationError('provider_error', 'Generation provider failed', metadata);
      }

      return {
        data: repairedParsed.data,
        ...metadata,
        promptTokens: repairAttempt.promptTokens,
        completionTokens: repairAttempt.completionTokens
      };
    } catch (error) {
      if (error instanceof ProviderGenerationError) {
        throw new ProviderGenerationError(error.category, error.message, error.metadata ?? metadata);
      }

      throw error;
    }
  }

  private async chatCompletion(model: string, messages: ChatMessage[]): Promise<ProviderChatResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.GENERATION_TIMEOUT_MS);

    try {
      const requestBody: Record<string, unknown> = {
        model,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3,
        stream: false
      };
      if (this.config.OPENAI_COMPATIBLE_THINKING) {
        requestBody.thinking = { type: this.config.OPENAI_COMPATIBLE_THINKING };
      }
      if (this.config.OPENAI_COMPATIBLE_REASONING_EFFORT) {
        requestBody.reasoning_effort = this.config.OPENAI_COMPATIBLE_REASONING_EFFORT;
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new ProviderGenerationError('provider_error');
      }

      const body = (await response.json()) as OpenAICompatibleChatResponse;
      const content = body.choices?.[0]?.message?.content;
      if (!content) {
        throw new ProviderGenerationError('provider_error');
      }

      return {
        content,
        promptTokens: numberOrUndefined(body.usage?.prompt_tokens),
        completionTokens: numberOrUndefined(body.usage?.completion_tokens)
      };
    } catch (error) {
      if (error instanceof ProviderGenerationError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderGenerationError('provider_timeout', 'Generation provider timed out');
      }

      throw new ProviderGenerationError('provider_error');
    } finally {
      clearTimeout(timeout);
    }
  }
}

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ProviderChatResult = {
  content: string;
  promptTokens?: number;
  completionTokens?: number;
};

type OpenAICompatibleChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
  };
};

function systemPrompt(): ChatMessage {
  return {
    role: 'system',
    content: [
      'You are PraxisLume, a Doctor Growth OS content planner.',
      'Generate general patient education and patient acquisition copy for clinics.',
      'Never provide diagnosis, individual treatment advice, cure guarantees, best-clinic claims, fearmongering, or identifiable patient stories.',
      'Never ask for or include patient names, reports, case histories, phone numbers, medical record numbers, or before/after claims.',
      'The doctor must review output before publication.',
      'Return only valid JSON for the requested schema.'
    ].join(' ')
  };
}

function parseProviderJson<TData>(
  content: string,
  schema: ZodType<TData>
): { ok: true; data: TData } | { ok: false } {
  try {
    return { ok: true, data: schema.parse(JSON.parse(content)) };
  } catch {
    return { ok: false };
  }
}

function hashPrompt(value: unknown) {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function requiredConfig(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function numberOrUndefined(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function contextLine(label: string, value?: string) {
  return value ? `${label}: ${value}` : undefined;
}
