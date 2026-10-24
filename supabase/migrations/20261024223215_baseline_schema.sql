


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_my_household"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT household_id FROM public.household_members 
  WHERE user_id = auth.uid() 
  ORDER BY created_at DESC 
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_my_household"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_member_of"("h_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members 
    WHERE household_id = h_id AND user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_member_of"("h_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_shopping_item_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.shopping_item_log (household_id, name)
  values (new.household_id, new.name)
  on conflict (household_id, lower(btrim(name))) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."log_shopping_item_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."household_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "household_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."household_members" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."household_member_profiles" WITH ("security_invoker"='on') AS
 SELECT "hm"."id",
    "hm"."household_id",
    "hm"."user_id",
    "hm"."email",
    "hm"."role",
    "hm"."created_at",
    ("u"."raw_user_meta_data" ->> 'avatar_url'::"text") AS "avatar_url",
    ("u"."raw_user_meta_data" ->> 'full_name'::"text") AS "display_name"
   FROM ("public"."household_members" "hm"
     LEFT JOIN "auth"."users" "u" ON (("u"."id" = "hm"."user_id")));


ALTER VIEW "public"."household_member_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."households" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."households" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "amount" numeric,
    "unit" "text",
    "is_basic" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "updated_by" "uuid" DEFAULT "auth"."uid"(),
    "optional" boolean DEFAULT false
);


ALTER TABLE "public"."ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "title" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "updated_by" "uuid" DEFAULT "auth"."uid"(),
    "household_id" "uuid" NOT NULL,
    CONSTRAINT "date_range_check" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."meal_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."planned_meals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meal_plan_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "recipe_id" "uuid",
    "recipe_title_cache" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "updated_by" "uuid" DEFAULT "auth"."uid"(),
    "notes" "text"
);


ALTER TABLE "public"."planned_meals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "instructions" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "updated_by" "uuid" DEFAULT "auth"."uid"(),
    "household_id" "uuid" NOT NULL,
    "source_url" "text",
    "cook_time" integer,
    "is_public" boolean DEFAULT false NOT NULL,
    "author_name" "text",
    "servings" integer
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "household_id" "uuid" NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."saved_recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopping_item_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "household_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopping_item_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopping_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "amount" numeric,
    "unit" "text",
    "completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "updated_by" "uuid" DEFAULT "auth"."uid"(),
    "household_id" "uuid" NOT NULL,
    "shop" "text"
);

ALTER TABLE ONLY "public"."shopping_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."shopping_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "dinner_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."household_members"
    ADD CONSTRAINT "household_members_household_id_email_key" UNIQUE ("household_id", "email");



ALTER TABLE ONLY "public"."household_members"
    ADD CONSTRAINT "household_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."households"
    ADD CONSTRAINT "households_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."planned_meals"
    ADD CONSTRAINT "plan_days_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_recipes"
    ADD CONSTRAINT "saved_recipes_household_id_recipe_id_key" UNIQUE ("household_id", "recipe_id");



ALTER TABLE ONLY "public"."saved_recipes"
    ADD CONSTRAINT "saved_recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopping_item_log"
    ADD CONSTRAINT "shopping_item_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_household_members_email" ON "public"."household_members" USING "btree" ("email");



CREATE INDEX "idx_household_members_user_id" ON "public"."household_members" USING "btree" ("user_id");



CREATE INDEX "idx_meal_plans_household_id" ON "public"."meal_plans" USING "btree" ("household_id");



CREATE INDEX "idx_recipes_household_id" ON "public"."recipes" USING "btree" ("household_id");



CREATE INDEX "idx_shopping_items_household_id" ON "public"."shopping_items" USING "btree" ("household_id");



CREATE UNIQUE INDEX "shopping_item_log_household_name_key" ON "public"."shopping_item_log" USING "btree" ("household_id", "lower"("btrim"("name")));



CREATE OR REPLACE TRIGGER "set_updated_at_dinner_plans" BEFORE UPDATE ON "public"."meal_plans" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_ingredients" BEFORE UPDATE ON "public"."ingredients" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_plan_days" BEFORE UPDATE ON "public"."planned_meals" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_recipes" BEFORE UPDATE ON "public"."recipes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_shopping_items" BEFORE UPDATE ON "public"."shopping_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "shopping_items_log_name" AFTER INSERT OR UPDATE OF "name" ON "public"."shopping_items" FOR EACH ROW EXECUTE FUNCTION "public"."log_shopping_item_name"();



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "dinner_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "dinner_plans_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "dinner_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."household_members"
    ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."household_members"
    ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id");



ALTER TABLE ONLY "public"."planned_meals"
    ADD CONSTRAINT "plan_days_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."planned_meals"
    ADD CONSTRAINT "plan_days_plan_id_fkey" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."meal_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."planned_meals"
    ADD CONSTRAINT "plan_days_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."planned_meals"
    ADD CONSTRAINT "plan_days_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."saved_recipes"
    ADD CONSTRAINT "saved_recipes_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_recipes"
    ADD CONSTRAINT "saved_recipes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_item_log"
    ADD CONSTRAINT "shopping_item_log_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id");



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Anyone can read public ingredients" ON "public"."ingredients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "ingredients"."recipe_id") AND ("recipes"."is_public" = true)))));



CREATE POLICY "Anyone can read public recipes" ON "public"."recipes" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Household members can manage ingredients" ON "public"."ingredients" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "ingredients"."recipe_id") AND ("recipes"."household_id" = "public"."get_my_household"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "ingredients"."recipe_id") AND ("recipes"."household_id" = "public"."get_my_household"())))));



CREATE POLICY "Household members can manage meal plans" ON "public"."meal_plans" TO "authenticated" USING (("household_id" = "public"."get_my_household"())) WITH CHECK (("household_id" = "public"."get_my_household"()));



CREATE POLICY "Household members can manage planned meals" ON "public"."planned_meals" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."meal_plans"
  WHERE (("meal_plans"."id" = "planned_meals"."meal_plan_id") AND ("meal_plans"."household_id" = "public"."get_my_household"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."meal_plans"
  WHERE (("meal_plans"."id" = "planned_meals"."meal_plan_id") AND ("meal_plans"."household_id" = "public"."get_my_household"())))));



CREATE POLICY "Household members can manage recipes" ON "public"."recipes" TO "authenticated" USING (("household_id" = "public"."get_my_household"())) WITH CHECK (("household_id" = "public"."get_my_household"()));



CREATE POLICY "Household members can manage saved recipes" ON "public"."saved_recipes" TO "authenticated" USING (("household_id" = "public"."get_my_household"())) WITH CHECK (("household_id" = "public"."get_my_household"()));



CREATE POLICY "Household members can manage shopping items" ON "public"."shopping_items" TO "authenticated" USING (("household_id" = "public"."get_my_household"())) WITH CHECK (("household_id" = "public"."get_my_household"()));



CREATE POLICY "Members can delete from their household's item log" ON "public"."shopping_item_log" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."household_members" "m"
  WHERE (("m"."household_id" = "shopping_item_log"."household_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "Members can insert into their household's item log" ON "public"."shopping_item_log" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."household_members" "m"
  WHERE (("m"."household_id" = "shopping_item_log"."household_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "Members can read their household's item log" ON "public"."shopping_item_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."household_members" "m"
  WHERE (("m"."household_id" = "shopping_item_log"."household_id") AND ("m"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."household_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."households" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "households_insert" ON "public"."households" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "households_select" ON "public"."households" FOR SELECT TO "authenticated" USING (("public"."is_member_of"("id") OR (EXISTS ( SELECT 1
   FROM "public"."household_members"
  WHERE (("household_members"."household_id" = "households"."id") AND ("household_members"."email" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "households_update" ON "public"."households" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."household_members"
  WHERE (("household_members"."household_id" = "households"."id") AND ("household_members"."user_id" = "auth"."uid"()) AND ("household_members"."role" = 'owner'::"text")))));



ALTER TABLE "public"."ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meal_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "members_delete" ON "public"."household_members" FOR DELETE TO "authenticated" USING (("public"."is_member_of"("household_id") OR ("email" = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "members_insert" ON "public"."household_members" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "members_select" ON "public"."household_members" FOR SELECT TO "authenticated" USING (("public"."is_member_of"("household_id") OR ("email" = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "members_update" ON "public"."household_members" FOR UPDATE TO "authenticated" USING (("public"."is_member_of"("household_id") OR ("email" = ("auth"."jwt"() ->> 'email'::"text"))));



ALTER TABLE "public"."planned_meals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_recipes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopping_item_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopping_items" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."shopping_item_log";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."shopping_items";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


























































































































































































GRANT ALL ON FUNCTION "public"."get_my_household"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_household"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_member_of"("h_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_member_of"("h_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_shopping_item_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_shopping_item_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_shopping_item_name"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";
























GRANT ALL ON TABLE "public"."household_members" TO "anon";
GRANT ALL ON TABLE "public"."household_members" TO "authenticated";
GRANT ALL ON TABLE "public"."household_members" TO "service_role";



GRANT ALL ON TABLE "public"."household_member_profiles" TO "anon";
GRANT ALL ON TABLE "public"."household_member_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."household_member_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."households" TO "anon";
GRANT ALL ON TABLE "public"."households" TO "authenticated";
GRANT ALL ON TABLE "public"."households" TO "service_role";



GRANT ALL ON TABLE "public"."ingredients" TO "anon";
GRANT ALL ON TABLE "public"."ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."meal_plans" TO "anon";
GRANT ALL ON TABLE "public"."meal_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_plans" TO "service_role";



GRANT ALL ON TABLE "public"."planned_meals" TO "anon";
GRANT ALL ON TABLE "public"."planned_meals" TO "authenticated";
GRANT ALL ON TABLE "public"."planned_meals" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."saved_recipes" TO "anon";
GRANT ALL ON TABLE "public"."saved_recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_recipes" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_item_log" TO "anon";
GRANT ALL ON TABLE "public"."shopping_item_log" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_item_log" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_items" TO "anon";
GRANT ALL ON TABLE "public"."shopping_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_items" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































