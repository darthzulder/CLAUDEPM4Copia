/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly WEB_ENTRY_PROCESS_ID?: string;
  readonly WEB_ENTRY_EVENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
