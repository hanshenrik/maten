/**
 * Environment variables the server needs. Read lazily so that a missing value
 * fails the request that needs it with a clear message, instead of crashing
 * the whole server at import time.
 */

const required = (name: keyof ImportMetaEnv): string => {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${String(name)}`);
  }
  return value;
};

export const env = {
  get supabaseUrl() {
    return required("PUBLIC_SUPABASE_URL");
  },
  get supabasePublishableKey() {
    return required("PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  },
  /** Optional. Only needed to send invitation e-mails. */
  get supabaseServiceRoleKey(): string | undefined {
    return import.meta.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
  },
  get siteUrl() {
    return import.meta.env.PUBLIC_SITE_URL || "https://maten.hanshenrik.com";
  },
};
