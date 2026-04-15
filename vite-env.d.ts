/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set in `.env` — exposed because `vite.config` uses `envPrefix: ['VITE_', 'GEMINI_']`. */
  readonly GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
