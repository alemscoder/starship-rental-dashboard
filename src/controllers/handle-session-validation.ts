import router from "@router/router.ts"
import { Toast } from "@components/Toast.ts"
import { checkCurrentSession } from "@controllers/check-current-session.ts"
import { handleLogoutAndRedirect } from "@controllers/handle-logout-and-redirect.ts"
import type { Context } from "@thepassle/app-tools/router.js"

/**
 * Validates the current user session and handles session-related errors and redirections.
 *
 * - If the user is on the login page, skips validation.
 * - Checks the current session's validity.
 * - If the session is valid, allows access.
 * - Handles network and rate limit errors by displaying appropriate error messages.
 * - If the session is invalid, logs out the user, redirects to the login page, and shows an error message.
 * @param routeContext - The routing context containing information about the current route.
 * @returns A promise that resolves to `true` if access should be blocked (e.g., due to 
 * invalid session or errors), or `false` if access is allowed.
 */
export async function handleSessionValidation(routeContext: Context) {
	if (routeContext.url.pathname === "/login") {
		return false
	}
	const currentSession = await checkCurrentSession()
	if (currentSession.isValidSession) {
		return false
	}
	if (currentSession.networkError) {
		Toast({
			message: `Network error connection: ${currentSession.networkError.message}`,
			duration: -1
		})
		return true
	}
	if (currentSession.requestsError) {
		Toast({
			message: currentSession.requestsError.message,
			duration: -1
		})
		return true
	}
	await handleLogoutAndRedirect()
	if (router.route?.path === "/login") {
		router.route.render?.(routeContext)
	}
	const errorMessage = 
		currentSession.actionError?.message ||
		currentSession.sessionError?.message ||
		"Access not allowed.\nCause: Auth session missing."
	Toast({
		message: errorMessage,
		duration: -1
	})
	return true
}
