import { serverClient } from "@lib/server.ts"
import { PostgrestError } from "@utils/errors.ts"
import { AuthError } from "@supabase/supabase-js"
import type { APIRoute } from "astro"

type RequestEntries = {
	id: string
}

export const POST: APIRoute = async (context) => {
	/** Create an instance of Supabase client */
	const supabase = serverClient(context)
	// Parse form data from the request
	const formData = await context.request.formData()
	const formEntries = Object.fromEntries(formData.entries()) as RequestEntries
	try {
		// Get the current user details
		const { data: { user }, error } = await supabase.auth.getUser()
		if (error || !user) {
			throw new AuthError(error?.message!, error?.status)
		}
		if (user.app_metadata.role === "admin") {
			// Delete the customer
			const customerResult = await supabase
				.from("customers")
				.delete()
				.eq("id", formEntries.id)
			if (customerResult.error) {
				throw new PostgrestError({
					message: customerResult.error.message,
					status: customerResult.status ?? 404
				})
			}
		} else {
			throw new AuthError("You are not authorized to delete this customer.", 403)
		}
		return new Response("Customer deleted successfully!", { status: 200 })
	} catch (error: any) {
		if (error instanceof AuthError && error.status !== 0) {
			return new Response(error.message, { status: error.status })
		}
		if (error instanceof AuthError && error.status === 0) {
			return new Response(
				"A connection problem occurred when trying to communicate with the server.", 
				{ status: 400 }
			)
		}
		if (error instanceof PostgrestError) {
			return new Response(
				`Error updating database:\n${error.message || "Database name not found."}`, 
				{ status: error.status }
			)
		}
		return new Response("An unexpected error occurred: " + error.message, { status: 500 })
	}
}
