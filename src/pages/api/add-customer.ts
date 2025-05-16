import { serverClient } from "@lib/server.ts"
import { formatZodErrors } from "@utils/zod.ts"
import { AuthError } from "@supabase/supabase-js"
import { PostgrestError } from "@utils/errors.ts"
import { StorageError } from "@supabase/storage-js"
import { customerSchema } from "@schema/customer.schema.ts"
import type { APIRoute } from "astro"

export const POST: APIRoute = async (context) => {
	/** Create an instance of Supabase client */
	const supabase = serverClient(context)
	// Parse form data from the request
	const formData = await context.request.formData()
	const formEntries = Object.fromEntries(formData.entries())
	// Validate form data using Zod schema
	const parseResult = customerSchema.safeParse(formEntries)
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
			throw new AuthError(error?.message!, error?.status)
		}
		if (user.app_metadata.role === "admin" ||
			user.app_metadata.role === "manager" || 
			user.app_metadata.role === "staff"
		) {
			// Prepare base `newData`
			const newData: Record<string, any> = {
				first_name: validatedData.first_name,
				last_name: validatedData.last_name,
				email: validatedData.email,
				phone: validatedData.phone,
				nationality: validatedData.nationality,
				language: validatedData.language,
				date_of_birth: validatedData.date_of_birth,
				age: validatedData.age,
				driver_license: validatedData.driver_license,
				address: validatedData.address
			}
			// Database insert
			const customerResult = await supabase
				.from("customers")
				.insert(newData)
			if (customerResult.error) {
				throw new PostgrestError({
					message: customerResult.error.message,
					status: customerResult.status ?? 404
				})
			}
		} else {
			throw new AuthError("You are not authorized to add a new customer.", 403)
		}
		return new Response("New customer added successfully!", { status: 200 })
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
		if (error instanceof StorageError) {
			return new Response(error.message, { status: 404 })
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
