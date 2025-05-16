import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

export function browserClient() {
	return createBrowserClient(
		supabaseUrl,
		supabaseKey
	)
}

