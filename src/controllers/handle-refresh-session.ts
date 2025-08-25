import { actions } from "astro:actions"
import { Toast } from "@components/Toast.ts"
import { browserClient } from "@lib/client.ts"
import { addUnsubscribe, unsubscribeStore } from "@store/unsubscribe.store.ts"
import { handleLogoutAndRedirect } from "@controllers/handle-logout-and-redirect.ts"

/**
 * Handles session refresh by subscribing to authentication state changes and refreshing
 * the session token as needed. On a "TOKEN_REFRESHED" event, this function attempts to
 * refresh the session by calling a server action, displaying a success or error message
 * as appropriate. If the server action calling return a error, it logs the user out and
 * redirects to the login page.
 *
 * - Uses a `setTimeout` to defer execution of async code in response to state change.
 * - Adds a cleanup function to the `unsubscribeStore` for efficient resource management.
 * - Avoids redundant subscriptions by checking the `unsubscribeStore`.
 * 
 */
export function handleRefreshSession() {
	/** Declare a variable to hold the cleanup function */
	let cleanup: (() => void) | null = null
	/** Supabase client instance */
	const supabase = browserClient()

	if (!unsubscribeStore.get()["handleRefreshSession"]) {
		// Subscribe to authentication state changes
		const { data } = supabase.auth.onAuthStateChange((event, session) => {
			//console.log(event)
			if (event === "TOKEN_REFRESHED") {
				/**
				 * The use of setTimeout function with a delay of 0ms
				 * is used  to defer execution of the asynchronous
				 * code, allowing the main callback to finish earlier.
				 * @url `https://supabase.com/docs/reference/javascript/auth-onauthstatechange`
				 */
				setTimeout(async () => {
					// Call the server action to refresh the session
					const { data, error } = await actions.session.refreshSession()
					if (data) {
						console.log(data)
						Toast({ message: data.message })
					}
					if (error) {
						console.error(error)
						console.log("Error refreshing session.", error.message)
						await handleLogoutAndRedirect()
						Toast({ 
							message: `Error refreshing session. \n${error.message}`
						})
					}
				}, 0)
				cleanup = () => {
					data.subscription.unsubscribe()
				}
				addUnsubscribe("handleRefreshSession", () => {
					if (cleanup) {
						cleanup()
					}
				})
			}
		})
	}
}
