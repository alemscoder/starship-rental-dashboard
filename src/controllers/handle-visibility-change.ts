import { actions } from "astro:actions"
import { Toast } from "@components/Toast.ts"
import { checkCurrentSession } from "@controllers/check-current-session.ts"
import { handleLogoutAndRedirect } from "@controllers/handle-logout-and-redirect.ts"

let refreshing = false

/**
 * Handles the browser tab visibility change event to ensure session validity.
 *
 * When the document becomes visible and the user is not on the login page,
 * this function checks if the current session is valid. If the session has expired
 * (specifically due to a JWT expiration), it attempts to refresh the session and
 * notifies the user of the outcome via toast messages. If the session cannot be
 * refreshed or is otherwise invalid, the user is logged out and redirected, with
 * an appropriate notification.
 *
 * This function should be called once to set up the event listener.
 *
 * @remarks
 * - Prevents multiple refresh attempts by using a `refreshing` flag.
 * - Uses toast notifications to inform the user about session status and errors.
 * - Relies on external functions: `checkCurrentSession`, `actions.session.refreshSession`,
 *   `handleLogoutAndRedirect`, and `Toast`.
 */
export function handleVisibilityChange() {
	document.addEventListener("visibilitychange", async () => {
		if (document.visibilityState !== "visible" || location.pathname === "/login") return
		if (refreshing) return
		const { isValidSession, actionError } = await checkCurrentSession()
		if (isValidSession) return
		if (!isValidSession  && actionError?.message.includes("jwt expired")) {
			refreshing = true
			Toast({ message: "User access token expired, refreshing session..." })
			const { data, error } = await actions.session.refreshSession()
			if (data) {
				Toast({ message: data.message })
			}
			if (error) {
				await handleLogoutAndRedirect()
				Toast({ 
					message: `Error refreshing session. \nCause: ${error.message}`, 
					duration: -1 
				})
			}
			refreshing = false
		} else if (!isValidSession) {
			await handleLogoutAndRedirect()
			Toast({ 
				message: "Session invalid. Please log in again.", 
				duration: -1 
			})
		}
	})
}
