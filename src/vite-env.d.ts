/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set by the deploy workflow to the commit SHA; see src/shared/assetUrl.ts. */
  readonly VITE_BUILD_ID?: string;
}
