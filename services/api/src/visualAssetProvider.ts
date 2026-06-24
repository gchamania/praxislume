import { createHash } from 'node:crypto';
import type { VisualAssetGenerationRequest } from '@praxislume/contracts';
import type { ApiConfig, ImageProviderName } from './config.js';
import {
  ProviderGenerationError,
  type GenerationProviderMetadata,
  type GenerationProviderResult
} from './generationProvider.js';

export type VisualAssetProviderResult = GenerationProviderResult<{
  prompt: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
}> & {
  bytes: Buffer;
};

const visualAssetPromptVersion = 'visual_asset:v1';
const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
);

export class VisualAssetProvider {
  private readonly provider: ImageProviderName;

  constructor(private readonly config: ApiConfig) {
    this.provider = config.IMAGE_PROVIDER;
  }

  providerInfo(): GenerationProviderMetadata {
    return {
      provider: this.provider,
      model: this.modelName(),
      promptVersion: this.provider === 'openai_compatible' ? visualAssetPromptVersion : 'visual_asset:fake-v1'
    };
  }

  async generate(request: VisualAssetGenerationRequest): Promise<VisualAssetProviderResult> {
    const prompt = safeVisualPrompt(request);
    if (this.provider === 'openai_compatible') {
      return this.generateOpenAICompatible(request, prompt);
    }

    const promptVersion = 'visual_asset:fake-v1';
    return {
      provider: 'fake',
      model: this.modelName(),
      promptVersion,
      promptHash: hashPrompt({ provider: 'fake', promptVersion, request, prompt }),
      data: {
        prompt,
        mimeType: 'image/png',
        width: 1024,
        height: 1024
      },
      bytes: onePixelPng
    };
  }

  private async generateOpenAICompatible(
    request: VisualAssetGenerationRequest,
    prompt: string
  ): Promise<VisualAssetProviderResult> {
    const baseUrl = requiredConfig(this.config.IMAGE_COMPATIBLE_BASE_URL, 'IMAGE_COMPATIBLE_BASE_URL').replace(/\/+$/, '');
    const apiKey = requiredConfig(this.config.IMAGE_COMPATIBLE_API_KEY, 'IMAGE_COMPATIBLE_API_KEY');
    const model = this.modelName();
    const promptHash = hashPrompt({
      provider: 'openai_compatible',
      promptVersion: visualAssetPromptVersion,
      model,
      request,
      prompt
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.GENERATION_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}${this.config.IMAGE_COMPATIBLE_GENERATIONS_PATH}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json'
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new ProviderGenerationError('provider_error');
      }

      const body = (await response.json()) as OpenAICompatibleImageResponse;
      const image = body.data?.[0];
      const bytes = image?.b64_json ? Buffer.from(image.b64_json, 'base64') : undefined;
      if (!bytes || bytes.length === 0) {
        throw new ProviderGenerationError('provider_error');
      }

      return {
        provider: 'openai_compatible',
        model,
        promptVersion: visualAssetPromptVersion,
        promptHash,
        data: {
          prompt,
          mimeType: 'image/png',
          width: 1024,
          height: 1024
        },
        bytes
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

  private modelName() {
    if (this.provider === 'fake') {
      return this.config.IMAGE_COMPATIBLE_MODEL ?? 'fake-image-v1';
    }
    return requiredConfig(this.config.IMAGE_COMPATIBLE_MODEL, 'IMAGE_COMPATIBLE_MODEL');
  }
}

type OpenAICompatibleImageResponse = {
  data?: Array<{
    b64_json?: string;
  }>;
};

function safeVisualPrompt(request: VisualAssetGenerationRequest) {
  return [
    'Create a clean, abstract medical education thumbnail for a clinic content package.',
    `Title: ${request.title}`,
    `Specialty: ${request.specialty}`,
    `Category: ${request.category}`,
    `Tone: ${request.tone}`,
    `Brand colors: primary ${request.brandColors.primary}, accent ${request.brandColors.accent}.`,
    'Use calm geometric shapes, soft clinical lighting, icon-like abstract medical motifs, and generous whitespace.',
    'Do not include people, faces, patient likenesses, body parts, anatomical findings, before/after scenes, procedure outcomes, reports, names, phone numbers, or readable text.'
  ].join('\n');
}

function requiredConfig(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
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
