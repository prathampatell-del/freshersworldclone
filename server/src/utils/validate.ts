import { badRequest } from './http';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseId(value: unknown, label = 'id'): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) throw badRequest(`Invalid ${label}`);
  return n;
}

export interface PaginationInput {
  page?: unknown;
  limit?: unknown;
}

export function parsePagination(query: PaginationInput, defaults = { page: 1, limit: 10, max: 50 }) {
  const page = clampInt(query.page, 1, Number.MAX_SAFE_INTEGER, defaults.page);
  const limit = clampInt(query.limit, 1, defaults.max, defaults.limit);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const raw = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  const n = Math.floor(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function parseOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) throw badRequest('Invalid numeric value');
  return Math.floor(n);
}

export function requireFields<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[]
): void {
  const missing = fields.filter(f => {
    const v = body[f];
    return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
  });
  if (missing.length) {
    throw badRequest(`Missing required fields: ${missing.join(', ')}`);
  }
}

export function validEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_RE.test(email) && email.length <= 254;
}

export function safeJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function safeJsonObject<T = unknown>(value: unknown, fallback: T): T {
  if (value && typeof value === 'object') return value as T;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
