import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * React's server cache is scoped to the current server request. Keeping the
 * Supabase client here lets every authorization consumer in that request use
 * the same cookie/session path without retaining identity across requests.
 */
export const getRequestSupabaseClient = cache(() => createClient());
