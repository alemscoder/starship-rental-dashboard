import { z } from "astro:schema"
import { serverClient } from "@lib/server.ts"
import { PostgrestError } from "@utils/errors.ts"
import { AuthError } from "@supabase/supabase-js"
import type { APIRoute } from "astro"
import type { Ticket } from "../../types.ts"

const schema = z.object({
	id: z.string().uuid()
})

export const POST: APIRoute = async (context) => {
	/** Create an instance of Supabase client */
	const supabase = serverClient(context)
	// Parse form data from the request
	const formData = await context.request.formData()
	const formEntries = Object.fromEntries(formData.entries())
	// Validate form data using Zod schema
	const parseResult = schema.safeParse(formEntries)
	if (!parseResult.success) {
		return new Response("Invalid ticket ID.", { status: 400 })
	}
	/** Store the form validated data */
	const validatedData = parseResult.data
	try {
		// Get the current user details
		const { data: { user }, error } = await supabase.auth.getUser()
		if (error || !user) {
			throw new AuthError(error?.message ?? "Unauthorized", error?.status)
		}
		// Check if the user has the required role to delete a ticket
		const allowedRoles = ["admin"]
		if (!allowedRoles.includes(user.app_metadata.role)) {
			throw new AuthError("You are not authorized to delete a ticket.", 403)
		}
		// Delete the ticket
		const { data: deletedTicket, error: deleteError } = await supabase
			.from("tickets")
			.delete()
			.eq("id", validatedData.id)
			.select("id")
			.returns<Ticket[]>()
			.single()
		if (deleteError) {
			throw new PostgrestError(deleteError)
		}
		if (!deletedTicket) {
			return new Response(
				JSON.stringify({ 
					error: "Ticket not found." 
				}),
				{ 
					status: 404, 
					headers: { "Content-Type": "application/json" } 
				}
			)
		}
		return new Response(
			JSON.stringify({
				ticket: deletedTicket,
				message: "Ticket deleted successfully!"
			}),
			{ 
				status: 200, 
				headers: { "Content-Type": "application/json" } 
			}
		)
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
