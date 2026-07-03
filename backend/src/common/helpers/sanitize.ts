import sanitizeHtml from 'sanitize-html';

export function stripHtml(value: unknown): string {
  if (typeof value !== 'string') return String(value ?? '');
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}
