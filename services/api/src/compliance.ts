import type { ComplianceReviewResponse } from '@praxislume/contracts';

const rules: Array<{ code: string; note: string; pattern: RegExp }> = [
  {
    code: 'cure_guarantee',
    note: 'Avoid cure guarantees or guaranteed medical outcomes.',
    pattern: /\b(?:guarantee|guaranteed|100%|cure|permanent cure)\b/i
  },
  {
    code: 'superiority_claim',
    note: 'Avoid unsubstantiated best, number one, or superiority claims.',
    pattern: /\b(?:best|number one|#1|leading clinic|top clinic)\b/i
  },
  {
    code: 'fearmongering',
    note: 'Avoid fear-based exaggeration.',
    pattern: /\b(?:dangerous if ignored|life threatening|act now or|too late)\b/i
  },
  {
    code: 'misleading_urgency',
    note: 'Avoid unsupported urgency.',
    pattern: /\b(?:limited time medical|urgent treatment required|immediate cure)\b/i
  },
  {
    code: 'before_after_claim',
    note: 'Before/after claims require explicit consent and regulatory care.',
    pattern: /\b(?:before and after|before\/after)\b/i
  }
];

export function reviewCompliance(content: string, contentVersionHash: string): ComplianceReviewResponse {
  const matches = rules.filter((rule) => rule.pattern.test(content));
  const status = matches.length > 0 ? 'flagged' : 'passed';

  return {
    status,
    issueCodes: matches.map((match) => match.code),
    notes: matches.map((match) => match.note),
    saferRewrite:
      status === 'flagged'
        ? 'Use general educational language, avoid guarantees, and invite patients to consult a qualified doctor.'
        : undefined,
    reviewedContentVersionHash: contentVersionHash
  };
}
