/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
interface ImportMetaEnv {
  readonly VITE_PUBLIC_SITE_URL?: string;
  readonly VITE_AGENDA_URL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_REGISTRATION_OPEN?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
