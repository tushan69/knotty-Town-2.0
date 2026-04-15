function baseWithSlash(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

/**
 * Resolves `/api/...` against Vite `import.meta.env.BASE_URL` so subdirectory deploys work.
 */
export function apiUrl(scriptWithQuery: string): string {
  const path = scriptWithQuery.replace(/^\/+/, '').replace(/^api\//, '');
  return `${baseWithSlash()}api/${path}`;
}

/** Absolute URL for files in `public/` (e.g. Razorpay logo). */
export function publicUrl(path: string): string {
  return `${baseWithSlash()}${path.replace(/^\/+/, '')}`;
}
