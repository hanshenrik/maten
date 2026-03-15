/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    user: import("@supabase/supabase-js").User | null;
    supabase: import("@supabase/supabase-js").SupabaseClient;
    householdId: string | undefined;
    pendingInvitesCount?: number;
  }
}
