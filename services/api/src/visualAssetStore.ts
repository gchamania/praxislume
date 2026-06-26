import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import type { ApiConfig } from './config.js';

export type StoredBinaryAsset = {
  assetId: string;
  storagePath: string;
  signedUrl: string;
  expiresInSeconds: number;
};

export type StoredVisualAsset = StoredBinaryAsset & {
  mimeType: 'image/svg+xml';
  width: number;
  height: number;
};

export type StoredPngAsset = StoredBinaryAsset & {
  sourceAssetId: string;
  mimeType: 'image/png';
  width: number;
  height: number;
};

export type ExportableVisualAsset = {
  assetId: string;
  clinicId: string;
  contentItemId?: string;
  storagePath: string;
  mimeType: 'image/svg+xml';
  width: number;
  height: number;
};

export type LogoAsset = {
  bytes: Uint8Array;
  mimeType: string;
};

export type StoredGeneratedAsset = {
  bytes: Uint8Array;
  mimeType: string;
};

export type SaveVisualAssetInput = {
  clinicId: string;
  contentItemId?: string;
  assetType: 'branded_post_asset' | 'ai_background';
  bytes: Uint8Array;
  mimeType: 'image/svg+xml';
  width: number;
  height: number;
  metadata: Record<string, unknown>;
};

export interface VisualAssetStore {
  downloadLogo(clinicId: string, logoPath?: string): Promise<LogoAsset | undefined>;
  saveAsset(input: SaveVisualAssetInput): Promise<StoredBinaryAsset>;
  brandedAssetForExport(input: {
    assetId: string;
    userId: string;
  }): Promise<ExportableVisualAsset | undefined>;
  downloadGeneratedAsset(storagePath: string): Promise<StoredGeneratedAsset | undefined>;
  savePngExport(input: {
    sourceAsset: ExportableVisualAsset;
    bytes: Uint8Array;
    width: number;
    height: number;
    metadata: Record<string, unknown>;
  }): Promise<StoredPngAsset>;
  latestBrandedAsset(input: {
    clinicId: string;
    contentItemId: string;
    userId: string;
  }): Promise<StoredVisualAsset | undefined>;
}

export class InMemoryVisualAssetStore implements VisualAssetStore {
  private readonly savedAssets: StoredVisualAsset[] = [];
  private readonly savedAssetBytes = new Map<string, Uint8Array>();
  private readonly savedPngExports: StoredPngAsset[] = [];

  async downloadLogo() {
    return undefined;
  }

  async saveAsset(input: SaveVisualAssetInput): Promise<StoredBinaryAsset> {
    const asset: StoredVisualAsset = {
      assetId: '77777777-7777-4777-8777-777777777777',
      storagePath: `${input.clinicId}/assets/final.svg`,
      signedUrl: 'https://storage.example.test/signed/final.svg',
      expiresInSeconds: 300,
      mimeType: input.mimeType,
      width: input.width,
      height: input.height
    };
    this.savedAssets.unshift(asset);
    this.savedAssetBytes.set(asset.storagePath, input.bytes);
    return asset;
  }

  async brandedAssetForExport(input: {
    assetId: string;
    userId: string;
  }): Promise<ExportableVisualAsset | undefined> {
    if (input.userId !== 'test-user-1') {
      return undefined;
    }
    const asset = this.savedAssets.find((candidate) => candidate.assetId === input.assetId);
    if (!asset) {
      return undefined;
    }
    return {
      assetId: asset.assetId,
      clinicId: asset.storagePath.split('/')[0] ?? '',
      storagePath: asset.storagePath,
      mimeType: asset.mimeType,
      width: asset.width,
      height: asset.height
    };
  }

  async downloadGeneratedAsset(storagePath: string): Promise<StoredGeneratedAsset | undefined> {
    const bytes = this.savedAssetBytes.get(storagePath);
    return bytes ? { bytes, mimeType: mimeTypeFromPath(storagePath) } : undefined;
  }

  async savePngExport(input: {
    sourceAsset: ExportableVisualAsset;
    bytes: Uint8Array;
    width: number;
    height: number;
    metadata: Record<string, unknown>;
  }): Promise<StoredPngAsset> {
    const asset: StoredPngAsset = {
      assetId: '88888888-8888-4888-8888-888888888888',
      sourceAssetId: input.sourceAsset.assetId,
      storagePath: `${input.sourceAsset.clinicId}/assets/final.png`,
      signedUrl: 'https://storage.example.test/signed/final.png',
      expiresInSeconds: 300,
      mimeType: 'image/png',
      width: input.width,
      height: input.height
    };
    this.savedPngExports.unshift(asset);
    return asset;
  }

  async latestBrandedAsset(): Promise<StoredVisualAsset | undefined> {
    return this.savedAssets[0];
  }
}

export class SupabaseVisualAssetStore implements VisualAssetStore {
  private readonly client: SupabaseClient;

  constructor(private readonly config: ApiConfig) {
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async downloadLogo(clinicId: string, logoPath?: string): Promise<LogoAsset | undefined> {
    if (!logoPath || !logoPath.startsWith(`${clinicId}/`)) {
      return undefined;
    }

    const { data, error } = await this.client.storage.from('clinic-logos').download(logoPath);
    if (error || !data) {
      return undefined;
    }

    return {
      bytes: new Uint8Array(await data.arrayBuffer()),
      mimeType: data.type || mimeTypeFromPath(logoPath)
    };
  }

  async saveAsset(input: SaveVisualAssetInput): Promise<StoredBinaryAsset> {
    const storagePath = `${input.clinicId}/assets/${input.assetType}-${Date.now()}-${nanoid(8)}.svg`;
    const expiresInSeconds = 300;

    const { error: uploadError } = await this.client.storage.from('generated-assets').upload(storagePath, input.bytes, {
      contentType: input.mimeType,
      upsert: false
    });
    if (uploadError) {
      throw uploadError;
    }

    const { data: row, error: rowError } = await this.client
      .from('generated_assets')
      .insert({
        clinic_id: input.clinicId,
        content_item_id: input.contentItemId,
        asset_type: input.assetType,
        storage_path: storagePath,
        template_version: 'branded_post_asset:v1',
        brand_kit_version: 1,
        metadata: {
          ...input.metadata,
          mimeType: input.mimeType,
          width: input.width,
          height: input.height
        }
      })
      .select('id')
      .single();
    if (rowError) {
      throw rowError;
    }

    const { data: signed, error: signedError } = await this.client.storage
      .from('generated-assets')
      .createSignedUrl(storagePath, expiresInSeconds);
    if (signedError || !signed?.signedUrl) {
      throw signedError ?? new Error('Unable to create signed generated asset URL');
    }

    return {
      assetId: String((row as { id: string }).id),
      storagePath,
      signedUrl: signed.signedUrl,
      expiresInSeconds
    };
  }

  async brandedAssetForExport(input: {
    assetId: string;
    userId: string;
  }): Promise<ExportableVisualAsset | undefined> {
    const { data: row, error } = await this.client
      .from('generated_assets')
      .select('id, clinic_id, content_item_id, storage_path, metadata, clinics!inner(owner_user_id)')
      .eq('id', input.assetId)
      .eq('asset_type', 'branded_post_asset')
      .eq('clinics.owner_user_id', input.userId)
      .maybeSingle();
    if (error) {
      throw error;
    }
    if (!row) {
      return undefined;
    }

    const metadata = (row as { metadata?: Record<string, unknown> }).metadata ?? {};
    const storagePath = String((row as { storage_path?: string }).storage_path ?? '');
    if (!storagePath) {
      return undefined;
    }

    return {
      assetId: String((row as { id: string }).id),
      clinicId: String((row as { clinic_id: string }).clinic_id),
      contentItemId: (row as { content_item_id?: string | null }).content_item_id ?? undefined,
      storagePath,
      mimeType: 'image/svg+xml',
      width: Number(metadata.width ?? 1080),
      height: Number(metadata.height ?? 1080)
    };
  }

  async downloadGeneratedAsset(storagePath: string): Promise<StoredGeneratedAsset | undefined> {
    const { data, error } = await this.client.storage.from('generated-assets').download(storagePath);
    if (error || !data) {
      return undefined;
    }
    return {
      bytes: new Uint8Array(await data.arrayBuffer()),
      mimeType: data.type || mimeTypeFromPath(storagePath)
    };
  }

  async savePngExport(input: {
    sourceAsset: ExportableVisualAsset;
    bytes: Uint8Array;
    width: number;
    height: number;
    metadata: Record<string, unknown>;
  }): Promise<StoredPngAsset> {
    const storagePath = `${input.sourceAsset.clinicId}/assets/branded_post_png-${Date.now()}-${nanoid(8)}.png`;
    const expiresInSeconds = 300;

    const { error: uploadError } = await this.client.storage.from('generated-assets').upload(storagePath, input.bytes, {
      contentType: 'image/png',
      upsert: false
    });
    if (uploadError) {
      throw uploadError;
    }

    const { data: row, error: rowError } = await this.client
      .from('generated_assets')
      .insert({
        clinic_id: input.sourceAsset.clinicId,
        content_item_id: input.sourceAsset.contentItemId,
        asset_type: 'branded_post_png',
        storage_path: storagePath,
        template_version: 'branded_post_png:v1',
        brand_kit_version: 1,
        metadata: {
          ...input.metadata,
          sourceAssetId: input.sourceAsset.assetId,
          mimeType: 'image/png',
          width: input.width,
          height: input.height
        }
      })
      .select('id')
      .single();
    if (rowError) {
      throw rowError;
    }

    const { data: signed, error: signedError } = await this.client.storage
      .from('generated-assets')
      .createSignedUrl(storagePath, expiresInSeconds);
    if (signedError || !signed?.signedUrl) {
      throw signedError ?? new Error('Unable to create signed generated asset URL');
    }

    return {
      assetId: String((row as { id: string }).id),
      sourceAssetId: input.sourceAsset.assetId,
      storagePath,
      signedUrl: signed.signedUrl,
      expiresInSeconds,
      mimeType: 'image/png',
      width: input.width,
      height: input.height
    };
  }

  async latestBrandedAsset(input: {
    clinicId: string;
    contentItemId: string;
    userId: string;
  }): Promise<StoredVisualAsset | undefined> {
    const expiresInSeconds = 300;
    const { data: row, error } = await this.client
      .from('generated_assets')
      .select('id, storage_path, metadata, clinics!inner(owner_user_id)')
      .eq('clinic_id', input.clinicId)
      .eq('content_item_id', input.contentItemId)
      .eq('asset_type', 'branded_post_asset')
      .eq('clinics.owner_user_id', input.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw error;
    }
    if (!row) {
      return undefined;
    }

    const storagePath = String((row as { storage_path: string }).storage_path);
    const { data: signed, error: signedError } = await this.client.storage
      .from('generated-assets')
      .createSignedUrl(storagePath, expiresInSeconds);
    if (signedError || !signed?.signedUrl) {
      throw signedError ?? new Error('Unable to create signed generated asset URL');
    }

    const metadata = (row as { metadata?: Record<string, unknown> }).metadata ?? {};
    return {
      assetId: String((row as { id: string }).id),
      storagePath,
      signedUrl: signed.signedUrl,
      expiresInSeconds,
      mimeType: 'image/svg+xml',
      width: Number(metadata.width ?? 1080),
      height: Number(metadata.height ?? 1080)
    };
  }
}

function mimeTypeFromPath(path: string) {
  const lowered = path.toLowerCase();
  if (lowered.endsWith('.svg')) {
    return 'image/svg+xml';
  }
  if (lowered.endsWith('.jpg') || lowered.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (lowered.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'image/png';
}
