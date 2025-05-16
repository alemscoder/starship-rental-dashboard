import { browserClient } from "@lib/client.ts"
import { AuthError } from "@supabase/supabase-js"
import { actions, ActionError } from "astro:actions"

/**
 * Checks the current user's session and verifies the user authentication token.
 * This function retrieves the user's session from Supabase and 
 * verifies the user authentication token through a backend action. 
 * It compares the user ID from the local session with the server-side
 * validated user ID. If either the session or token verification fails, 
 * it returns the respective error information.
 * @returns An object containing:
 *  - `isValidSession`: Boolean indicating whether the user ID from the session and the server match.
 *  - `requestsError`: Error related to user server requests, or `null` if no error.
 *  - `actionError`: Error related to user token verification, or `null` if no error.
 *  - `sessionError`: Error related to the Supabase session, or `null` if no error.
 *  - `networkError`: Error related to network issues, or `null` if no error.
 */
export async function checkCurrentSession() {
	const supabase = browserClient()
	try {
		const {
			data: { session },
			error: sessionError,
		} = await supabase.auth.getSession()
		if (sessionError) {
			throw new Error(`Supabase session error.\n${sessionError.message}`)
		}
		const { data: actionData, error: actionError } =
			await actions.auth.verifyUserAuthToken()
		if (actionError?.code === "TOO_MANY_REQUESTS") {
			throw new Error(actionError.message)
		}
		if (actionError) {
			throw new Error(`User access token verification error. ${actionError.message}`)
		}
		const localUserId = session?.user.id
		const serverUserId = actionData
		const isValidSession = localUserId === serverUserId
		return {
			isValidSession,
			requestsError: null,
			actionError: null,
			sessionError: null,
			networkError: null
		}		
	} catch (error: any) {
		return {
			isValidSession: false,
			requestsError: error.message.includes("requests") ? error as ActionError : null,
			actionError: error.message.includes("token") ? error as ActionError : null,
			sessionError: error.message.includes("session") ? error as AuthError : null,
			networkError: error.message.includes("fetch") ? error as Error : null
		}
	}
}
