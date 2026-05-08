// Resolve Supabase env vars. In production runtime, missing envs are a fatal
// config error (we throw so the misconfiguration is loud instead of silently
// producing broken queries). During `next build` and dev we fall back to
// placeholder values so the build/dev server can still load without secrets.
const isProd = process.env.NODE_ENV === 'production';
const isBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-export';

function readEnv(name, { fallback }) {
  const value = process.env[name];
  if (value && value.length > 0) return value;

  if (isProd && !isBuildPhase) {
    throw new Error(
      `[supabase] Missing required environment variable ${name}. ` +
        'Set it in your hosting platform before deploying.',
    );
  }

  // Dev / build only: log once so the fallback is visible.
  if (typeof console !== 'undefined') {
    console.warn(`[supabase] ${name} not set — using dev placeholder`);
  }
  return fallback;
}

export function getSupabaseUrl() {
  return readEnv('NEXT_PUBLIC_SUPABASE_URL', {
    fallback: 'https://dummy.supabase.co',
  });
}

export function getSupabaseAnonKey() {
  return readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', { fallback: 'dummy' });
}

export function getSupabaseServiceRoleKey() {
  return readEnv('SUPABASE_SERVICE_ROLE_KEY', { fallback: 'dummy' });
}
