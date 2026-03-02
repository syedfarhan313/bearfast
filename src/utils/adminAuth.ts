const normalizeEmail = (value?: string | null) =>
  (value || '').trim().toLowerCase();

const adminEnv =
  (import.meta.env.VITE_ADMIN_EMAILS as string | undefined) ||
  (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ||
  'bearfast313@gmail.com';

export const ADMIN_EMAILS = adminEnv
  .split(',')
  .map((email) => normalizeEmail(email))
  .filter(Boolean);

const adminEmailSet = new Set(ADMIN_EMAILS);

export const isAdminEmail = (email?: string | null) =>
  adminEmailSet.has(normalizeEmail(email));
