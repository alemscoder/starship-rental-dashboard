import jwt from "jsonwebtoken"
import { defineAction } from "astro:actions"
import { AuthError } from "@supabase/supabase-js"
import { PostgrestError } from "@utils/errors.ts"
import { serverClient, cookieProdOptions } from "@lib/server.ts"
import type { Employees as User } from "../types.ts"

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

			const { data: { user }, error: userError } = await supabase.auth.getUser()

			if (userError) {
				console.error("Error getting user details.", userError)
				throw new AuthError(userError.message, userError.status)
			}

			const { data: queryData, error: queryError } = await supabase
				.from("employees")
				.select("*")
				.eq("id", user?.id)
				.returns<User[]>()

			if (queryError) {
				throw new PostgrestError({ message: queryError.message })
			}

			userData = queryData[0]

			const userDate = new Date(user?.last_sign_in_at!)
			const dbDate = new Date(userData.last_sign_in_at)

			if (userData.last_sign_in_at === null || dbDate.getTime() !== userDate.getTime()) {
				const { error: updateError } = await supabase
					.from("employees")
					.update({ last_sign_in_at: user?.last_sign_in_at, status: "online" })
					.eq("id", user?.id)
				if (updateError) {
					throw new PostgrestError({ 
						message: `Error updating database:\n${updateError.message || "Database name not found."}`
					})
				}
				userData.last_sign_in_at = user?.last_sign_in_at!
				userData.status = "online"
			}

			return userData
		}
	})
}
