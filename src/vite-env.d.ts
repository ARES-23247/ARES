/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  __PLAYWRIGHT_TEST__?: boolean;
}

interface ImportMetaEnv {
  readonly VITE_PARTYKIT_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
