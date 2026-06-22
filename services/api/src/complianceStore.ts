import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ApiConfig } from './config.js';

export type ComplianceReviewEntry = {
  clinicId: string;
  contentItemId?: string;
  reviewedContentVersionHash: string;
  status: 'passed' | 'flagged' | 'blocked';
  issueCodes: string[];
  notes: string[];
  saferRewrite?: string;
  reviewerType: 'rules' | 'model' | 'human';
  reviewerModel?: string;
};

export interface ComplianceReviewStore {
  recordReview(entry: ComplianceReviewEntry): Promise<void>;
}

export class InMemoryComplianceReviewStore implements ComplianceReviewStore {
  private readonly entries: ComplianceReviewEntry[] = [];

  async recordReview(entry: ComplianceReviewEntry): Promise<void> {
    this.entries.push(entry);
  }

  all() {
    return [...this.entries];
  }
}

export class SupabaseComplianceReviewStore implements ComplianceReviewStore {
  private readonly client: SupabaseClient;

  constructor(config: ApiConfig) {
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async recordReview(entry: ComplianceReviewEntry): Promise<void> {
    const { error } = await this.client.from('content_compliance_reviews').insert({
      clinic_id: entry.clinicId,
      content_item_id: entry.contentItemId,
      reviewed_content_version_hash: entry.reviewedContentVersionHash,
      status: entry.status,
      issue_codes: entry.issueCodes,
      notes: entry.notes,
      safer_rewrite: entry.saferRewrite,
      reviewer_type: entry.reviewerType,
      reviewer_model: entry.reviewerModel
    });
    if (error) {
      throw error;
    }
  }
}
