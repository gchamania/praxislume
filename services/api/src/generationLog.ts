export type GenerationLogEntry = {
  clinicId: string;
  userId: string;
  generationType: string;
  provider: string;
  model: string;
  status: 'succeeded' | 'failed';
  latencyMs: number;
  requestId: string;
  errorCategory?: string;
};

export class InMemoryGenerationLog {
  private readonly entries: GenerationLogEntry[] = [];

  record(entry: GenerationLogEntry) {
    this.entries.push(entry);
  }

  all() {
    return [...this.entries];
  }
}
