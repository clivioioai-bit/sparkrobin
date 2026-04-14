export type DbJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';

export function normalizeDbJobStatus(status?: string | null): DbJobStatus {
  const normalized = (status || '').trim().toLowerCase();

  switch (normalized) {
    case 'pending':
    case 'queued':
    case 'queue':
    case 'pending_retry':
      return 'pending';
    case 'processing':
    case 'running':
      return 'processing';
    case 'completed':
    case 'complete':
    case 'success':
    case 'succeeded':
    case 'finished':
    case 'done':
      return 'completed';
    case 'failed':
    case 'fail':
    case 'error':
      return 'failed';
    case 'canceled':
    case 'cancelled':
      return 'canceled';
    default:
      return 'pending';
  }
}

export function mapDbStatusToApiJobStatus(status?: string | null):
  'PENDING' | 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' {
  switch (normalizeDbJobStatus(status)) {
    case 'pending':
      return 'QUEUED';
    case 'processing':
      return 'RUNNING';
    case 'completed':
      return 'SUCCEEDED';
    case 'failed':
      return 'FAILED';
    case 'canceled':
      return 'CANCELED';
  }
}

export function isDbJobFinalStatus(status?: string | null): boolean {
  const normalized = normalizeDbJobStatus(status);
  return normalized === 'completed' || normalized === 'failed' || normalized === 'canceled';
}
