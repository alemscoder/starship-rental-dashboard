import jwt from "jsonwebtoken"
import { ActionError, defineAction } from "astro:actions"
import { AuthError } from "@supabase/supabase-js"
import { PostgrestError } from "@utils/errors.ts"
import { serverClient, cookieProdOptions } from "@lib/server.ts"
import type { Employee as User } from "../types.ts"

const SECRET_JWT_KEY = import.meta.env.SECRET_JWT_KEY
const JWT_EXPIRE_TIME = import.meta.env.JWT_EXPIRE_TIME

export const session = {
	refreshSession: defineAction({
		handler: async (input, context) => {

			const supabase = serverClient(context)

			const { 
				data: sessionData, 
				error: sessionError 
			} = await supabase.auth.refreshSession()

			if (sessionError) {
				console.error("Error refreshing session.", sessionError)
				throw new AuthError(sessionError.message, sessionError.status)
			}

			const userAccessToken = jwt.sign(
				{ id: sessionData.user?.id },
				SECRET_JWT_KEY,
				{ expiresIn: Number(JWT_EXPIRE_TIME) }
			)
			context.cookies.set("user-access-token", userAccessToken, cookieProdOptions)

			return {
				message: "Session refreshed successfully.",
			}
		}
	}),
	getUserData: defineAction({
		handler: async (input, context) => {
			let userData: User
			const supabase = serverClient(context)
			const { data: { user: userAuth }, error: userError } = await supabase.auth.getUser()
			if (userError) {
				console.error("Error getting user from Supabase Auth.", userError)
				throw new ActionError({
					code: "INTERNAL_SERVER_ERROR",
					message: userError.message
				})
			}
			if (!userAuth) {
				throw new ActionError({
					code: "UNAUTHORIZED",
					message: "User not logged in."
				})
			}
			const { data: queryData, error: queryError } = await supabase
				.from("employees")
				.select("*")
				.eq("id", userAuth.id)
				.returns<User[]>()
				.single()
			if (queryError) {
				console.error("Error getting user details from database", queryError)
				throw new ActionError({
					code: "INTERNAL_SERVER_ERROR",
					message: queryError.message
				})
			}
			userData = queryData
			const userDate = new Date(userAuth.last_sign_in_at!)
			const dbDate = new Date(userData.last_sign_in_at)
			if (userData.last_sign_in_at === null || dbDate.getTime() !== userDate.getTime()) {
				const { error: updateError } = await supabase
					.from("employees")
					.update({ last_sign_in_at: userAuth.last_sign_in_at, status: "online" })
					.eq("id", userAuth.id)
				if (updateError) {
					console.error("Error updating fields in database", updateError)
					throw new ActionError({
						code: "INTERNAL_SERVER_ERROR",
						message: updateError.message || "Database name not found."
					})
				}
				userData.last_sign_in_at = userAuth.last_sign_in_at!
				userData.status = "online"
			}
			return userData
		}
	})
}
