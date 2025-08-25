import router from "@router/router.ts"
import { Toast } from "@components/Toast.ts"
import { checkCurrentSession } from "@controllers/check-current-session.ts"
import { handleLogoutAndRedirect } from "@controllers/handle-logout-and-redirect.ts"
import type { Context } from "@thepassle/app-tools/router.js"

/**
 * Handles session validation for protected routes.
 *
 * This function checks the current session's validity and manages user authentication state.
 * - If the route is `/login`, it skips validation.
 * - If the session is valid, it allows access.
 * - If there are network or request errors, it displays a toast notification and prevents access.
 * - If the session token is expired, it shows a countdown notification and triggers a page reload
 *	 to let the middleware handle session refresh.
 * - If session refresh fails or other errors occur, it logs the user out, redirects as needed, 
 * 	 and displays an error message.
 * @note The page reload approach on JWT expiration is implemented to handle Chrome Android's
 * "page discarding" behavior, which automatically reloads pages left in background or when is 
 * closed from the recent apps and open again.
 * @param routeContext - The context object for the current route, containing information such as the URL.
 * @returns A promise that resolves to `true` if access should be prevented (e.g., due to invalid 
 * session or errors), or `false` if access is allowed.
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
			message: `Network error connection: ${currentSession.networkError.message}`
		})
		return true
	}
	if (currentSession.requestsError) {
		Toast({
			message: currentSession.requestsError.message
		})
		return true
	}
	if (
		!currentSession.isValidSession &&
		currentSession.actionError?.message.includes("jwt expired")
	) {
		let secondsLeft = 5
		Toast({ message: `User access token expired, refreshing session in ${secondsLeft} seconds` })
		const countdownInterval = setInterval(() => {
			secondsLeft--
			const toastMessage = document.querySelector<HTMLPreElement>("vaadin-notification-card pre")
			if (toastMessage) {
				toastMessage.textContent = `User access token expired, refreshing session in ${secondsLeft} seconds`
			}
			if (secondsLeft <= 0) {
				clearInterval(countdownInterval)
				location.reload()
			}
		}, 1000)
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
		message: errorMessage
	})
	return true
}
