import { serverClient } from "@lib/server.ts"
import { formatZodErrors } from "@utils/zod.ts"
import { AuthError } from "@supabase/supabase-js"
import { PostgrestError } from "@utils/errors.ts"
import { calculeRentDuration } from "@controllers/tickets.ts"
import { getTicketSelect, toPostgresTimestamp } from "@utils/utils.ts"
import { newTicketSchema } from "@schema/ticket.schema.ts"
import type { APIRoute } from "astro"
import type { Ticket } from "../../types.ts"

export const POST: APIRoute = async (context) => {
	/** Create an instance of Supabase client */
	const supabase = serverClient(context)
	// Parse form data from the request
	const formData = await context.request.formData()
	const formEntries = Object.fromEntries(formData.entries())
	// Validate form data using Zod schema
	const parseResult = newTicketSchema.safeParse(formEntries)
	if (!parseResult.success) {
		const formattedErrors = formatZodErrors(parseResult.error)
		return new Response(
			JSON.stringify({
				errorType: "inputValidationError",
				errors: formattedErrors,
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			}
		)
	}
	/** Store the form validated data */
	const validatedData = parseResult.data
	try {
		// Get the current user details
		const { data: { user }, error } = await supabase.auth.getUser()
		if (error || !user) {
			throw new AuthError(error?.message ?? "Unauthorized", error?.status)
		}
		// Check if the user has the required role to add a new ticket
		const allowedRoles = ["admin", "manager", "staff"]
		if (!allowedRoles.includes(user.app_metadata.role)) {
			throw new AuthError("You are not authorized to add a new ticket.", 403)
		}
		// Prepare base `newData`
		const newData: Record<string, any> = {
			customer_id: validatedData.customer,
			ship_id: validatedData.starship,
			pickup_location_id: validatedData.pickup_location,
			pickup_date: toPostgresTimestamp(validatedData.pickup_date),
			return_location_id: validatedData.return_location,
			return_date: toPostgresTimestamp(validatedData.return_date),
			total_cost: validatedData.total_cost,
			status: "pending"
		}
		// calcule `rent_duration` and insert in the base `newData` with the key-value
		const rentDuration = calculeRentDuration(validatedData.pickup_date, validatedData.return_date)
		if (rentDuration && rentDuration.success) {
			newData.rent_duration = rentDuration.message
		}
		// Database insert
		const { data: ticket, error: insertError } = await supabase
			.from("tickets")
			.insert(newData)
			.select(getTicketSelect())
			.returns<Ticket[]>()
			.single()
		if (insertError) {
			throw new PostgrestError(insertError)
		}
		return new Response(
			JSON.stringify({
				ticket: ticket,
				message: "New ticket added successfully!",
			}),
			{
				status: 201,
				headers: { "Content-Type": "application/json" },
			},
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
				`Error inserting into database:\n${error.message || "Database name not found."}`, 
				{ status: error.status }
			)
		}
		return new Response("An unexpected error occurred: " + error.message, { status: 500 })
	}
}
