import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ApiConfig } from './config.js';

export type GenerationStatus = 'succeeded' | 'failed' | 'blocked';

export type GenerationLogEntry = {
  clinicId: string;
  userId: string;
  generationType: string;
  provider: string;
  model: string;
  status: GenerationStatus;
  latencyMs: number;
  requestId: string;
  errorCategory?: string;
  inputSummary?: Record<string, unknown>;
  structuredOutput?: unknown;
  outputReferenceId?: string;
  promptVersion?: string;
  promptHash?: string;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCost?: number;
};

export type UsageReservationInput = {
  clinicId: string;
  userId: string;
  generationType: string;
  limitCount?: number;
};

export type UsageReservationResult = {
  allowed: boolean;
  usedCount: number;
  limitCount: number;
};

export interface GenerationStore {
  reserveUsage(input: UsageReservationInput): Promise<UsageReservationResult>;
  recordGeneration(entry: GenerationLogEntry): Promise<void>;
}

export class InMemoryGenerationStore implements GenerationStore {
  private readonly entries: GenerationLogEntry[] = [];
  private readonly usage = new Map<string, number>();

  constructor(private readonly dailyLimit: number) {}

  async reserveUsage(input: UsageReservationInput): Promise<UsageReservationResult> {
    const key = `${input.clinicId}:${input.generationType}:${new Date().toISOString().slice(0, 10)}`;
    const limitCount = input.limitCount ?? this.dailyLimit;
    const usedCount = this.usage.get(key) ?? 0;
    if (usedCount >= limitCount) {
      return { allowed: false, usedCount, limitCount };
    }
    this.usage.set(key, usedCount + 1);
    return { allowed: true, usedCount: usedCount + 1, limitCount };
  }

  async recordGeneration(entry: GenerationLogEntry): Promise<void> {
    this.entries.push(entry);
  }

  all() {
    return [...this.entries];
  }
}

export class SupabaseGenerationStore implements GenerationStore {
  private readonly client: SupabaseClient;

  constructor(private readonly config: ApiConfig) {
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async reserveUsage(input: UsageReservationInput): Promise<UsageReservationResult> {
    const periodStart = new Date().toISOString().slice(0, 10);
    const periodEnd = periodStart;
    const usageType = input.generationType;
    const { data: existing, error: readError } = await this.client
      .from('usage_credits')
      .select('id, used_count, limit_count')
      .eq('clinic_id', input.clinicId)
      .eq('usage_type', usageType)
      .eq('period_start', periodStart)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    if (existing) {
      const usedCount = Number(existing.used_count ?? 0);
      const limitCount = Number(existing.limit_count ?? input.limitCount ?? this.config.GENERATION_DAILY_LIMIT);
      if (usedCount >= limitCount) {
        return { allowed: false, usedCount, limitCount };
      }
      const nextUsedCount = usedCount + 1;
      const { error: updateError } = await this.client
        .from('usage_credits')
        .update({ used_count: nextUsedCount })
        .eq('id', existing.id);
      if (updateError) {
        throw updateError;
      }
      return { allowed: true, usedCount: nextUsedCount, limitCount };
    }

    const { error: insertError } = await this.client.from('usage_credits').insert({
      clinic_id: input.clinicId,
      usage_type: usageType,
      period_start: periodStart,
      period_end: periodEnd,
      used_count: 1,
      limit_count: input.limitCount ?? this.config.GENERATION_DAILY_LIMIT
    });
    if (insertError) {
      throw insertError;
    }
    return { allowed: true, usedCount: 1, limitCount: input.limitCount ?? this.config.GENERATION_DAILY_LIMIT };
  }

  async recordGeneration(entry: GenerationLogEntry): Promise<void> {
    const { error } = await this.client.from('ai_generation_logs').insert({
      clinic_id: entry.clinicId,
      user_id: nullableUuid(entry.userId),
      generation_type: entry.generationType,
      provider: entry.provider,
      model: entry.model,
      request_correlation_id: entry.requestId,
      prompt_version: entry.promptVersion,
      prompt_hash: entry.promptHash,
      input_summary: entry.inputSummary ?? {},
      output_reference_id: entry.outputReferenceId,
      structured_output: entry.structuredOutput,
      prompt_tokens: entry.promptTokens,
      completion_tokens: entry.completionTokens,
      estimated_cost: entry.estimatedCost,
      latency_ms: entry.latencyMs,
      status: entry.status,
      error_category: entry.errorCategory
    });
    if (error) {
      throw error;
    }
  }
}

function nullableUuid(value?: string) {
  if (!value) {
    return null;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}
