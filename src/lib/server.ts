import { 
	createServerClient, 
	createBrowserClient, 
	parseCookieHeader 
} from "@supabase/ssr"
import type { APIContext } from "astro"
import type { CookieOptions } from "@supabase/ssr"
import type { ActionAPIContext } from "astro:actions"

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRole = import.meta.env.SERVICE_ROLE

export const cookieDevOptions = {
	sameSite: "lax", // Better security without blocking development features
	path: "/", // Available throughout the app
	secure: false, // Don't need HTTPS in localhost
	httpOnly: false, // Allow javascript access from client-side
	maxAge: 3600, // Expire in one hour
} as CookieOptions

export const cookieProdOptions = {
	sameSite: "strict", // Better security against CSRF attacks
	path: "/", // Available throughout the app
	secure: import.meta.env.MODE === "production", // Require HTTPS when in production
	httpOnly: true, // Not accessible from JavaScript client-side
	maxAge: 604800, // Expire in one week
} as CookieOptions

export function serverClient(context?: APIContext | ActionAPIContext) {
	return createServerClient(
		supabaseUrl,
		supabaseKey,
		{
			cookies: {
				getAll() {
					return parseCookieHeader(context?.request.headers.get("Cookie") ?? "")
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) =>
						context?.cookies.set(name, value, options))
				},
			},
		}
	)
}

export function createSupabaseAdmin() {
	return createBrowserClient(
		supabaseUrl,
		supabaseServiceRole,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		}
	)
}
