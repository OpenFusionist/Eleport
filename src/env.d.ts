/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_UPDATE_SERVER_URL: string;
  readonly MAIN_VITE_SELF_UPDATE_SERVER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}