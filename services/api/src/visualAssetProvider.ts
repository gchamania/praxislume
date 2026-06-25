import { createHash } from 'node:crypto';
import type {
  VisualAssetGenerationRequest,
  VisualBriefResponse
} from '@praxislume/contracts';
import type { ApiConfig, ImageProviderName } from './config.js';

export type VisualAssetProviderMetadata = {
  provider: ImageProviderName;
  model: string;
  promptVersion: string;
  promptHash?: string;
};

export type VisualBackgroundResult = VisualAssetProviderMetadata & {
  bytes: Uint8Array;
  mimeType: string;
  width: number;
  height: number;
  providerPrompt: string;
};

export class VisualAssetProviderError extends Error {
  constructor(
    readonly category: 'provider_error' | 'provider_timeout',
    message = 'Visual asset provider failed',
    readonly metadata?: Partial<VisualAssetProviderMetadata>
  ) {
    super(message);
    this.name = 'VisualAssetProviderError';
  }
}

export interface VisualAssetProviderRouter {
  providerInfo(): VisualAssetProviderMetadata;
  generateBackground(
    request: VisualAssetGenerationRequest,
    brief: VisualBriefResponse
  ): Promise<VisualBackgroundResult>;
}

const visualPromptVersion = 'visual_asset_background:v1';

export function createVisualAssetProviderRouter(config: ApiConfig): VisualAssetProviderRouter {
  return new ConfiguredVisualAssetProviderRouter(config);
}

export function buildVisualBrief(request: VisualAssetGenerationRequest): VisualBriefResponse {
  const style = visualStyleLabel(request.visualStyle);
  return {
    prompt: [
      `${style} for a ${request.specialty} patient education post about ${request.title}.`,
      `Use a calm healthcare composition with primary color ${request.brandColors.primary} and accent ${request.brandColors.accent}.`,
      `Use abstract clinic-safe medical shapes related to ${request.category.replace(/_/g, ' ')}.`,
      'Leave clean negative space for PraxisLume to add text overlays later.',
      'No readable text, no logo, no faces, no patients, no identifiable people, no before and after imagery, no anatomical findings, no procedure outcome image.'
    ].join(' '),
    negativePrompt:
      'No readable text, no logo, no faces, no patients, no identifiable people, no before and after, no anatomical findings, no procedure outcome, no fearmongering.',
    overlayGuidance: 'Keep the center-left and lower-right areas calm enough for clinic text, CTA, and disclaimer overlays.'
  };
}

class ConfiguredVisualAssetProviderRouter implements VisualAssetProviderRouter {
  constructor(private readonly config: ApiConfig) {}

  providerInfo(): VisualAssetProviderMetadata {
    return {
      provider: this.config.IMAGE_PROVIDER,
      model: this.model(),
      promptVersion: visualPromptVersion
    };
  }

  async generateBackground(
    request: VisualAssetGenerationRequest,
    brief: VisualBriefResponse
  ): Promise<VisualBackgroundResult> {
    if (this.config.IMAGE_PROVIDER === 'fal_ai') {
      return this.generateFalBackground(request, brief);
    }

    if (this.config.IMAGE_PROVIDER === 'openai_image') {
      return this.generateOpenAIBackground(request, brief);
    }

    return this.generateFakeBackground(request, brief);
  }

  private generateFakeBackground(
    request: VisualAssetGenerationRequest,
    brief: VisualBriefResponse
  ): VisualBackgroundResult {
    const promptHash = hashPrompt({ provider: 'fake', model: this.model(), brief });
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">',
      '<defs>',
      `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${escapeXml(request.brandColors.primary)}"/><stop offset="1" stop-color="${escapeXml(request.brandColors.accent)}"/></linearGradient>`,
      '</defs>',
      '<rect width="1080" height="1080" fill="url(#bg)"/>',
      '<circle cx="870" cy="210" r="220" fill="#ffffff" opacity="0.18"/>',
      '<circle cx="180" cy="860" r="260" fill="#ffffff" opacity="0.12"/>',
      '<path d="M190 420c140-170 310-170 510 0 82 70 154 96 220 78" fill="none" stroke="#ffffff" stroke-width="34" opacity="0.20" stroke-linecap="round"/>',
      '</svg>'
    ].join('');

    return {
      provider: 'fake',
      model: this.model(),
      promptVersion: visualPromptVersion,
      promptHash,
      bytes: new TextEncoder().encode(svg),
      mimeType: 'image/svg+xml',
      width: 1080,
      height: 1080,
      providerPrompt: brief.prompt
    };
  }

  private async generateOpenAIBackground(
    request: VisualAssetGenerationRequest,
    brief: VisualBriefResponse
  ): Promise<VisualBackgroundResult> {
    const model = this.model();
    const providerPrompt = [
      `Create a clinic-safe infographic-style background for a ${request.specialty} patient education post about ${request.title}.`,
      brief.prompt,
      `Safety constraints: ${brief.negativePrompt}`,
      brief.overlayGuidance,
      'Do not include readable text, labels, captions, clinic names, doctor names, logos, faces, patients, identifiable people, before/after imagery, anatomical findings, or procedure outcome imagery.'
    ].join('\n\n');
    const promptHash = hashPrompt({ provider: 'openai_image', model, providerPrompt, request });
    const metadata = {
      provider: 'openai_image' as const,
      model,
      promptVersion: visualPromptVersion,
      promptHash
    };

    const response = await withTimeout(
      fetch(`${this.config.OPENAI_IMAGE_BASE_URL.replace(/\/+$/, '')}/images/generations`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${requiredConfig(this.config.OPENAI_IMAGE_API_KEY, 'OPENAI_IMAGE_API_KEY')}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt: providerPrompt,
          n: 1,
          size: '1024x1024',
          output_format: 'png'
        })
      }),
      this.config.GENERATION_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new VisualAssetProviderError('provider_error', 'OpenAI image generation failed', metadata);
    }

    const body = (await response.json()) as OpenAIImageGenerateResponse;
    const b64Json = body.data?.[0]?.b64_json;
    if (!b64Json) {
      throw new VisualAssetProviderError('provider_error', 'OpenAI image generation returned no image', metadata);
    }

    return {
      ...metadata,
      bytes: new Uint8Array(Buffer.from(b64Json, 'base64')),
      mimeType: 'image/png',
      width: 1024,
      height: 1024,
      providerPrompt
    };
  }

  private async generateFalBackground(
    request: VisualAssetGenerationRequest,
    brief: VisualBriefResponse
  ): Promise<VisualBackgroundResult> {
    const model = this.model();
    const providerPrompt = `${brief.prompt}\n\nSafety constraints: ${brief.negativePrompt}\n\n${brief.overlayGuidance}`;
    const promptHash = hashPrompt({ provider: 'fal_ai', model, providerPrompt, request });
    const metadata = {
      provider: 'fal_ai' as const,
      model,
      promptVersion: visualPromptVersion,
      promptHash
    };

    const response = await withTimeout(
      fetch(`${this.config.FAL_RUN_BASE_URL.replace(/\/+$/, '')}/${model}`, {
        method: 'POST',
        headers: {
          authorization: `Key ${requiredConfig(this.config.FAL_KEY, 'FAL_KEY')}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          prompt: providerPrompt,
          image_size: 'square_hd',
          num_images: 1,
          enable_safety_checker: true,
          output_format: 'png',
          num_inference_steps: 4,
          guidance_scale: 3.5
        })
      }),
      this.config.GENERATION_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new VisualAssetProviderError('provider_error', 'fal.ai generation failed', metadata);
    }

    const body = (await response.json()) as FalGenerateResponse;
    const firstImage = body.images?.[0];
    if (!firstImage?.url || body.has_nsfw_concepts?.some(Boolean)) {
      throw new VisualAssetProviderError('provider_error', 'fal.ai returned no safe image', metadata);
    }

    const imageResponse = await withTimeout(fetch(firstImage.url), this.config.GENERATION_TIMEOUT_MS);
    if (!imageResponse.ok) {
      throw new VisualAssetProviderError('provider_error', 'Unable to download fal.ai image', metadata);
    }

    return {
      ...metadata,
      bytes: new Uint8Array(await imageResponse.arrayBuffer()),
      mimeType: imageResponse.headers.get('content-type') ?? firstImage.content_type ?? 'image/png',
      width: firstImage.width ?? 1080,
      height: firstImage.height ?? 1080,
      providerPrompt
    };
  }

  private model() {
    if (this.config.IMAGE_PROVIDER === 'fal_ai') {
      return this.config.FAL_IMAGE_MODEL;
    }

    if (this.config.IMAGE_PROVIDER === 'openai_image') {
      return this.config.OPENAI_IMAGE_MODEL;
    }

    return 'fake-image-v1';
  }
}

type OpenAIImageGenerateResponse = {
  data?: Array<{
    b64_json?: string;
  }>;
};

type FalGenerateResponse = {
  images?: Array<{
    url?: string;
    width?: number;
    height?: number;
    content_type?: string;
  }>;
  has_nsfw_concepts?: boolean[];
};

function visualStyleLabel(style: VisualAssetGenerationRequest['visualStyle']) {
  switch (style) {
    case 'clean_medical_abstract':
      return 'Clean modern abstract medical background';
    case 'soft_clinic_gradient':
      return 'Soft premium clinic gradient background';
    case 'friendly_health_illustration':
      return 'Friendly minimal healthcare illustration background';
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new VisualAssetProviderError('provider_timeout', 'Visual asset provider timed out')),
      timeoutMs
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export function hashPrompt(value: unknown) {
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

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
