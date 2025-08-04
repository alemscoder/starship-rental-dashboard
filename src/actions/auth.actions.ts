import jwt from "jsonwebtoken"
import { z } from "astro:schema"
import { isDemoUser } from "@utils/demo-users.ts"
import { AuthError } from "@supabase/supabase-js"
import { PostgrestError } from "@utils/errors.ts"
import { newUser } from "@schema/employee.schema.ts"
import { defineAction, ActionError } from "astro:actions"
//import { checkIfRateLimited } from "@utils/check-if-rate-limited.ts"
import { serverClient, createSupabaseAdmin, cookieProdOptions } from "@lib/server.ts"

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
	loginWithLink: defineAction({
		accept: "json",
		input: z.object({
			email: z
				.string()
				.email({ message: "Invalid email address." })
		}),
		handler: async (input, context) => {
			const supabase = serverClient(context)
			const supabaseAdmin = createSupabaseAdmin()
			if (!isDemoUser(input.email)) {
				throw new ActionError({
					code: "UNAUTHORIZED",
					message: "The selected demo user is not in the list.",
				})
			}
			const { data, error } = await supabaseAdmin.auth.admin.generateLink({
				type: "magiclink",
				email: input.email
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
			const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
				token_hash: data?.properties?.hashed_token!,
				type: "magiclink"
			})
			if (verifyError) {
				throw new ActionError({
					code: "UNAUTHORIZED",
					message: "Failed to verify login link.",
				})
			}
			const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
				access_token: verifyData.session?.access_token!,
				refresh_token: verifyData.session?.refresh_token!
			})
			if (sessionError) {
				throw new ActionError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create user session.",
				})
			}
			const userAccessToken = jwt.sign(
				{ id: sessionData.user?.id },
				SECRET_JWT_KEY,
				{ expiresIn: Number(JWT_EXPIRE_TIME) }
			)
			context.cookies.set("user-access-token", userAccessToken, cookieProdOptions)
			return {
				message: "Login successfully."
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
			const supabase = serverClient(context)
			// const isRateLimited = await checkIfRateLimited(context)
			// if (isRateLimited) {
			// 	throw new ActionError({
			// 		message: "Too many requests, please try again later.",
			// 		code: "TOO_MANY_REQUESTS",
			// 	})
			// }
			const { data: sessionData } = await supabase.auth.getSession()
			const userAccessToken = context.cookies.get("user-access-token")
			if (!userAccessToken || !sessionData.session) {
				throw new ActionError({ 
					message: "\nCause: token or session not found.", 
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
