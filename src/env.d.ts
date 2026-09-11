/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  readonly PUBLIC_SITE_URL?: string;
  /** Server only. Needed to send invitation e-mails. */
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
}

declare namespace App {
  interface Locals {
    user: import("@supabase/supabase-js").User | null;
    supabase: import("@supabase/supabase-js").SupabaseClient;
    householdId: string | undefined;
    pendingInvitesCount: number;
  }
}
