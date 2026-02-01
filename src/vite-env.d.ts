/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly http://127.0.0.1:8000: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

