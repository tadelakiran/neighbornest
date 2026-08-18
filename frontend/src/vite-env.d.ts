/// <reference types="vite/client" />

/**
 * Strongly-typed environment variables exposed via `import.meta.env`.
 * Only `VITE_`-prefixed variables are available to client code.
 */
interface ImportMetaEnv {
  /** Base URL of the NeighborNest API Gateway (e.g. http://localhost:8080). */
  readonly VITE_API_URL?: string;

  /**
   * Opt-in invisible keep-alive. Set to 'true' to periodically ping the
   * backend's GET /health endpoint from the browser. Default: disabled.
   */
  readonly VITE_ENABLE_KEEP_ALIVE?: string;

  /** Keep-alive ping interval in milliseconds (default 600000 = 10 min). */
  readonly VITE_KEEP_ALIVE_INTERVAL_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
