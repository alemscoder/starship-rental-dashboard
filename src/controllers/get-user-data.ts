import { actions } from "astro:actions"
import { Toast } from "@components/Toast.ts"
import { userDataStore } from "@store/userData.store.ts"
import { handleLogoutAndRedirect } from "@controllers/handle-logout-and-redirect.ts"

/**
 * Retrieves user data from the server and manages it in the local store.
 * 
 * This function calls a server action to fetch user data. If `userDataStore` already 
 * contains user data, the function exits early without making a server request.

 * **On success, it:**
 * - Updates `userDataStore` with the retrieved data
 * - Dispatches a global "user-data-loaded" event to notify other parts of the application
 * 
 * **On failure (error or no data):**
 * - Shows a toast notification informing the user
 * - Automatically redirects to the login page after a 5-second delay
 * 
 * @returns A promise that resolves when:
 * - The user data is successfully fetched and stored, or
 * - The user is redirected due to an error, or
 * - No fetch is needed (data already exists in store)
 * @throws May indirectly throw errors from:
 * - The server action (`actions.session.getUserData()`)
 * - The logout handler (`handleLogoutAndRedirect()`)
 * @sideeffects
 * - Modifies the global `userDataStore` state
 * - Displays UI notifications via Toast
 * - May trigger page navigation
 * - Dispatches global "user-data-loaded" event on success
 */
export async function getUserData() {
	if (userDataStore.get()) return
	const { data, error } = await actions.session.getUserData()
	if (error || !data) {
		Toast({ 
			message: "Error getting user data. Redirecting to login page."
		})
		setTimeout(async () => {
			await handleLogoutAndRedirect()
		}, 5000)
	}
	if (data) userDataStore.set(data)
	const event = new Event("user-data-loaded")
	window.dispatchEvent(event)
	return Promise.resolve()
}
