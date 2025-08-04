import { DEMO_USERS } from "@utils/demo-users.ts"
import type { APIRoute } from "astro"

const DEMO_MODE = import.meta.env.PUBLIC_APP_DEMO_MODE
const ALLOWED_DOMAINS = [
	"starship-rental-dashboard.vercel.app",
	...(import.meta.env.DEV ? ["localhost"] : [])
]

export const GET: APIRoute = (context) => {
	const demoMode = context.request.headers.get("x-demo-mode")
	if (!demoMode || demoMode !== DEMO_MODE) {
		return new Response(
			JSON.stringify({ error: "Demo access denied. Check configuration." }),
			{ 
				headers: { "Content-Type": "application/json" },
				status: 401 
			},
		)
	}
	const origin = context.request.headers.get("origin")
	const referer = context.request.headers.get("referer")
	const host = context.request.headers.get("host")
	const getDomain = (urlStr: string | null) => {
		try {
			return new URL(urlStr!).hostname
		} catch {
			return null
		}
	}
	const requestDomain = getDomain(origin) || getDomain(referer) || host
	const isAllowedRequest = ALLOWED_DOMAINS.includes(requestDomain!)
	if (!isAllowedRequest) {
		return new Response(
			JSON.stringify({ error: "Demo access denied. Invalid request source." }),
			{ 
				headers: { "Content-Type": "application/json" },
				status: 403 
			}
		)
	}
	return new Response(
		JSON.stringify(DEMO_USERS),
		{
			headers: { 
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": origin || ALLOWED_DOMAINS[0]
			}
		}
	)
}
