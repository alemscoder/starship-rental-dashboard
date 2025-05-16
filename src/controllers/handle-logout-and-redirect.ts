import Cookies from "js-cookie"
import router from "@router/router.ts"
import { actions } from "astro:actions"
import { Toast } from "@components/Toast.ts"
import { userDataStore } from "@store/userData.store.ts"
import { resetAllGridStores } from "@store/gridData.store.ts"
import { unsubscribeFromAll } from "@store/unsubscribe.store.ts"

/**
 * Logs out the current user and redirects to the login page.
 *
 * This function:
 * - Calls `actions.auth.logout()` to perform the logout operation.
 * - Removes the authentication cookie if a error occurs.
 * - Clears the user data store and resets all grid-related stores.
 * - Unsubscribes from all active subscriptions.
 * - Navigates the user to the login page.
 * - Displays a toast notification if an network error occurs during logout.
 *
 * @async
 */
export async function handleLogoutAndRedirect() {

	try {
		const { error } = await actions.auth.logout()
		if (error) {
			Cookies.remove("sb-nooyggwqjkpfbkptcype-auth-token")
		}
		userDataStore.set(null)
		resetAllGridStores()
		unsubscribeFromAll()
		router.navigate("/login")
	} catch (error: any) {
		Toast({ message: `Network error connection: ${error.message}`, duration: -1 })
	}

}
