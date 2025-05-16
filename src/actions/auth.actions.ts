import jwt from "jsonwebtoken"
import { z } from "astro:schema"
import { AuthError } from "@supabase/supabase-js"
import { PostgrestError } from "@utils/errors.ts"
import { defineAction, ActionError } from "astro:actions"
import { serverClient, cookieProdOptions } from "@lib/server.ts"
//import { checkIfRateLimited } from "@utils/check-if-rate-limited.ts"
import { newUser } from "@schema/employee.schema.ts"

const SECRET_JWT_KEY = import.meta.env.SECRET_JWT_KEY
const JWT_EXPIRE_TIME = import.meta.env.JWT_EXPIRE_TIME

export const auth = {
	userRegister: defineAction({
		accept: "form",
		input: newUser,
		handler: async (input, context) => {
			const supabase = serverClient(context)
			const { error, data } = await supabase.auth.signUp({
				email: input.email,
				password: input.password,
				options: {
					data: {
						display_name: input.first_name + " " + input.last_name,
					}
				}
			})
			if (error instanceof AuthError && error.status !== 0) {
				throw new ActionError({
					code: "UNAUTHORIZED",
					message: error.message,
				})
			} else if (error instanceof AuthError && error.status === 0) {
				throw new ActionError({ 
					message: "A connection problem occurred when trying to communicate with the server.", 
					code: "TIMEOUT" 
				})
			}
			return {
				message: "User registered successfully."
			}
		}
	}),
	loginWithPassword: defineAction({
		accept: "json",
		input: z.object({
			email: z
				.string()
				.email({ message: "Invalid email address." }),
			password: z
				.string()
				.min(6, { message: "Password must be longer than 5 characters." }),
		}),
		handler: async (input, context) => {
			const supabase = serverClient(context)
			const { data, error } = await supabase.auth.signInWithPassword({
				email: input.email,
				password: input.password,
			})
			if (error instanceof AuthError && error.status !== 0) {
				throw new ActionError({
					code: "UNAUTHORIZED",
					message: error.message,
				})
			} else if (error instanceof AuthError && error.status === 0) {
				throw new ActionError({ 
					message: "A connection problem occurred when trying to communicate with the server.", 
					code: "TIMEOUT" 
				})
			}
			const userAccessToken = jwt.sign(
				{ id: data.user?.id },
				SECRET_JWT_KEY,
				{ expiresIn: Number(JWT_EXPIRE_TIME) }
			)
			context.cookies.set("user-access-token", userAccessToken, cookieProdOptions)
			return {
				message: "Login successfully."
			}
		}
	}),
	resetPassword: defineAction({
		accept: "form",
		input: z.object({
			email: z
				.string()
				.email({ message: "Invalid email address." }),
		}),
		handler: async (input, context) => {
			const supabase = serverClient(context)
			const { error, data } = await supabase.auth.resetPasswordForEmail(input.email)
			if (error instanceof AuthError && error.status !== 0) {
				throw new ActionError({
					code: "UNAUTHORIZED",
					message: error.message,
				})
			} else if (error instanceof AuthError && error.status === 0) {
				throw new ActionError({ 
					message: "A connection problem occurred when trying to communicate with the server.", 
					code: "TIMEOUT" 
				})
			}
			return {
				message: "Password reset link send successfully."
			}
		},
	}),
	logout: defineAction({
		handler: async (input, context) => {
			const supabase = serverClient(context)
			context.cookies.delete("user-access-token", cookieProdOptions)
			const { data: { user }, error: userError } = await supabase.auth.getUser()
			if (userError) {
				throw new AuthError(userError.message, userError.status)
			}
			const { error: updateError } = await supabase
				.from("employees")
				.update({ status: "offline" })
				.eq("id", user?.id)
			if (updateError) {
				throw new PostgrestError({ 
					message: `Error updating database:\n${updateError.message || "Database name not found."}`
				})
			}
			const { error } = await supabase.auth.signOut()
			if (error) {
				throw new AuthError(error.message, error.status)
			}
		}
	}),
	verifyUserAuthToken: defineAction({
		handler: async (input, context) => {
			// const isRateLimited = await checkIfRateLimited(context)
			// if (isRateLimited) {
			// 	throw new ActionError({
			// 		message: "Too many requests, please try again later.",
			// 		code: "TOO_MANY_REQUESTS",
			// 	})
			// }
			const userAccessToken = context.cookies.get("user-access-token")
			if (!userAccessToken) {
				throw new ActionError({ 
					message: "\nCause: token not found.", 
					code: "UNAUTHORIZED" 
				})
			}
			try {
				const data = jwt.verify(userAccessToken.value, SECRET_JWT_KEY) as { id: string }
				return data.id
			} catch (error) {
				if (error instanceof jwt.JsonWebTokenError) {
					throw new ActionError({ 
						message: `\nCause: ${error.message}`, 
						code: "UNAUTHORIZED" 
					})
				} else {
					throw new ActionError({ 
						message: "\nCause: unknown error", 
						code: "UNAUTHORIZED" 
					})
				}
			}
		}
	})
}
