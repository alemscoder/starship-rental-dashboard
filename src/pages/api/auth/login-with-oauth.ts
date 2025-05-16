import { serverClient } from "@lib/server"
import type { APIRoute, APIContext } from "astro"
import type { Provider } from "@supabase/supabase-js"

export const POST: APIRoute = async (context: APIContext) => {
	const supabase = serverClient(context)
	const formData = await context.request.formData()
	const provider = formData.get("provider")?.toString()
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: provider as Provider,
		options: {
			redirectTo: import.meta.env.DEV
			? "http://localhost:4321/api/auth/callback"
			: "https://starship-rental-dashboard.vercel.app/api/auth/callback"
		},
	})
	if (error) {
		return new Response(error.message, { status: 500 })
	}
	return context.redirect(data.url)
}
