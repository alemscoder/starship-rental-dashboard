import { actions } from "astro:actions"
import { Toast } from "@components/Toast.ts"
import { userDataStore } from "@store/userData.store.ts"
import { handleLogoutAndRedirect } from "@controllers/handle-logout-and-redirect.ts"

/**
 * Retrieves user data from the server and manages it in the local store.
 * 
 * This function calls a server action to fetch user data. If `userDataStore` already 
 * contains user data, the function exits early without making a server request.
 * 
 * **Success Flow:**
 * - Updates `userDataStore` with the retrieved data
 * - Dispatches a global "user-data-loaded" event to notify other parts of the application
 * - Returns `true`
 * 
 * **Error Flow:**
 * - All error cases trigger logout redirect and UI cleanup
 * - Returns `false`
 * 
 * **UI Cleanup on Error:**
 * - Removes "loading" class from login container
 * - Re-enables disabled login forms
 * 
 * @returns A promise that resolves to:
 * - `true` when user data is successfully loaded or already exists
 * - `false` when an error occurs or user is redirected to login
 * 
 * @throws May propagate errors from:
 * - Server action (`actions.session.getUserData()`)
 * - Logout handler (`handleLogoutAndRedirect()`)
 */
export async function getUserData(): Promise<boolean> {
	if (userDataStore.get()) return true
	try {
		const { data, error } = await actions.session.getUserData()
		if (error) {
			if (error.code === "INTERNAL_SERVER_ERROR") {
				Toast({ 
					message: "Error getting user data. Redirecting to login page."
				})
			} else if (error.code === "UNAUTHORIZED") {
				Toast({ 
					message: "Error getting user logged. Redirecting to login page."
				})
			}
			await handleLogoutAndRedirect()
			const loginContainer = document.querySelector(".login-container")
			const loginForm = loginContainer?.querySelector("vaadin-login-form")
			loginContainer?.classList.remove("loading")
			if (loginForm && loginForm.disabled) loginForm.disabled = false
			return false
		}
		if (data) userDataStore.set(data)
		const event = new Event("user-data-loaded")
		window.dispatchEvent(event)
		return true
	} catch (error: any) {
		console.log(error)
		Toast({ message: `Error connection: ${error.message}` })
		return false
	}
}
