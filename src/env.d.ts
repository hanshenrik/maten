/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    user: import("@supabase/supabase-js").User | null;
    supabase: import("@supabase/supabase-js").SupabaseClient;
    householdId: string | undefined;
    pendingInvitesCount?: number;
    queryCache: {
      getOrSet: <T>(key: string, fetchFn: () => Promise<T>) => Promise<T>;
      get: <T>(key: string) => T | undefined;
      set: <T>(key: string, data: T) => void;
      has: (key: string) => boolean;
      clear: () => void;
      delete: (key: string) => void;
    };
  }
}
