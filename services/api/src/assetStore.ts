import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VisualAssetGenerationResponse } from '@praxislume/contracts';
import type { ApiConfig } from './config.js';

export type SaveVisualAssetInput = {
  clinicId: string;
  contentItemId?: string;
  requestId: string;
  assetType: 'ai_generated_thumbnail';
  bytes: Buffer;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
  metadata?: Record<string, unknown>;
};

export interface GeneratedAssetStore {
  saveVisualAsset(input: SaveVisualAssetInput): Promise<VisualAssetGenerationResponse>;
}

export class InMemoryGeneratedAssetStore implements GeneratedAssetStore {
  async saveVisualAsset(input: SaveVisualAssetInput): Promise<VisualAssetGenerationResponse> {
    const assetId = randomUUID();
    return {
      assetId,
      storagePath: visualAssetPath(input),
      mimeType: input.mimeType,
      width: input.width,
      height: input.height,
      signedUrl: `https://storage.example.test/generated-assets/${assetId}.png`,
      expiresInSeconds: 300
    };
  }
}

export class SupabaseGeneratedAssetStore implements GeneratedAssetStore {
  private readonly client: SupabaseClient;

  constructor(config: ApiConfig) {
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async saveVisualAsset(input: SaveVisualAssetInput): Promise<VisualAssetGenerationResponse> {
    const storagePath = visualAssetPath(input);
    const { error: uploadError } = await this.client.storage.from('generated-assets').upload(storagePath, input.bytes, {
      contentType: input.mimeType,
      upsert: true
    });
    if (uploadError) {
      throw uploadError;
    }

    const { data: assetRow, error: insertError } = await this.client
      .from('generated_assets')
      .insert({
        clinic_id: input.clinicId,
        content_item_id: input.contentItemId,
        asset_type: input.assetType,
        storage_path: storagePath,
        template_version: 'ai-generated-thumbnail-v1',
        metadata: {
          mimeType: input.mimeType,
          width: input.width,
          height: input.height,
          ...(input.metadata ?? {})
        }
      })
      .select('id')
      .single();
    if (insertError) {
      throw insertError;
    }

    const { data: signedUrlData, error: signedUrlError } = await this.client.storage
      .from('generated-assets')
      .createSignedUrl(storagePath, 300);
    if (signedUrlError) {
      throw signedUrlError;
    }

    return {
      assetId: String(assetRow.id),
      storagePath,
      mimeType: input.mimeType,
      width: input.width,
      height: input.height,
      signedUrl: signedUrlData.signedUrl,
      expiresInSeconds: 300
    };
  }
}

function visualAssetPath(input: SaveVisualAssetInput) {
  const baseName = input.contentItemId ?? input.requestId.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `${input.clinicId}/assets/${baseName}-thumbnail.${extensionForMimeType(input.mimeType)}`;
}

function extensionForMimeType(mimeType: SaveVisualAssetInput['mimeType']) {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/png':
      return 'png';
  }
}
