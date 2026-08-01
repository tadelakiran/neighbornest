/// <reference types="vite/client" />

/**
 * Strongly-typed environment variables exposed via `import.meta.env`.
 * Only `VITE_`-prefixed variables are available to client code.
 */
interface ImportMetaEnv {
  /** Base URL of the NeighborNest API Gateway (e.g. http://localhost:8080). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
