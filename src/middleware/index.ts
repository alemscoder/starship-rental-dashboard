import micromatch from "micromatch"
import { actions } from "astro:actions"
import { serverClient } from "@lib/server.ts"
import { defineMiddleware } from "astro:middleware"
import type { MiddlewareHandler } from "astro"

const rootRoute = ["(|/)"]
const loginRoute = ["/login(|/)"]
const protectedRoutes = [
	"/rentals(|/**)",
	"/ships(|/**)",
	"/support(|/**)",
	"/settings(|/**)"
]
const actionsRoutes = ["/_actions(|/)"]
const protectedAPIRoutes = [
	"/api/add-customer(|/)",
	"/api/add-employee(|/)",
	"/api/add-location(|/)",
	"/api/add-starship(|/)",
	"/api/delete-customer(|/)",
	"/api/delete-employee(|/)",
	"/api/delete-location(|/)",
	"/api/delete-starship(|/)",
	"/api/edit-customer(|/)",
	"/api/edit-employee(|/)",
	"/api/edit-location(|/)",
	"/api/edit-starship(|/)"
]

export const onRequest: MiddlewareHandler = defineMiddleware(
	async (context, next) => {

		const supabase = serverClient(context)

		if (micromatch.isMatch(context.url.pathname, rootRoute)) {
			console.warn("ROOT ROUTE")
		}

		if (micromatch.isMatch(context.url.pathname, loginRoute)) {
			console.warn("LOGIN ROUTE")
			if (
				context.cookies.has("user-access-token") ||
				context.cookies.has("sb-nooyggwqjkpfbkptcype-auth-token")
			) {
				return context.redirect("/rentals/tickets")
			}
		}

		if (micromatch.isMatch(context.url.pathname, protectedRoutes)) {
			console.warn("PROTECTED ROUTES")
			const { 
				data, 
				error 
			} = await context.callAction(actions.session.refreshSession, {})
			if (error) {
				context.redirect("/login")
			}
			if (data) {
				console.warn(data)
			}
		}

		if (micromatch.isMatch(context.url.pathname, actionsRoutes)) {
			console.warn("ACTIONS ROUTES")
		}

		if (micromatch.isMatch(context.url.pathname, protectedAPIRoutes)) {
			console.warn("APIS ROUTES")
			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession()
			if (sessionError) {
				return new Response(
					`Supabase session error.\n${sessionError.message}`, 
					{ status: 401 }
				)
			}
			const { 
				data: actionData, 
				error: actionError 
			} = await context.callAction(actions.auth.verifyUserAuthToken, {})
			if (actionError?.code === "TOO_MANY_REQUESTS") {
				return new Response(actionError.message, { status: 429 })
			}
			if (actionError) {
				return new Response(
					`User access token verification error. ${actionError.message}`, 
					{ status: 401 }
				)
			}
			const localUserId = session?.user.id
			const serverUserId = actionData
			const isValidSession = localUserId === serverUserId
			if (!isValidSession) {
				return new Response(
					"Access not allowed.\nCause: user session is invalid.", 
					{ status: 401 }
				)
			}
		}

		return next()
	}
)
