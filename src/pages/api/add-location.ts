import { serverClient } from "@lib/server.ts"
import { formatZodErrors } from "@utils/zod.ts"
import { uploadFile } from "@lib/utils.server.ts"
import { PostgrestError } from "@utils/errors.ts"
import { AuthError } from "@supabase/supabase-js"
import { StorageError } from "@supabase/storage-js"
import { locationSchema } from "@schema/location.schema.ts"
import type { APIRoute } from "astro"

export const POST: APIRoute = async (context) => {
	/** Create an instance of Supabase client */
	const supabase = serverClient(context)
	// Parse form data from the request
	const formData = await context.request.formData()
	const formEntries = Object.fromEntries(formData.entries())
	// Validate form data using Zod schema
	const parseResult = locationSchema.safeParse(formEntries)
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
			// Prepare base `newData` without planet_avatar field
			const newData: Record<string, any> = {
				name: validatedData.name,
				description: validatedData.description,
				coordinates: validatedData.coordinates,
				hours_of_operation: validatedData.hours_of_operation,
				employees: validatedData.employees,
				gravity: validatedData.gravity,
			}
			// Handle planet avatar file upload if provided
			if (validatedData.planet_avatar instanceof File) {
				// The base filename
				const baseFileName = (formEntries.id as string).split("-")[0]
				// Generate a random number of 6 digits between 0 and 999999 for the filename
				const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
				// Upload new file with pattern in filename
				const planetAvatarFile = validatedData.planet_avatar
				const fileExt = planetAvatarFile.name.split(".").pop()
				const fileName = `${baseFileName}-${randomNum}.${fileExt}`
				const filePath = `planets/${fileName}`
				const { path } = await uploadFile({
					context: context, 
					bucket: "avatars", 
					filePath: filePath, 
					file: planetAvatarFile,
					fileOptions: {
						upsert: true
					}
				})
				// Update the base `newData` with the key-value of the planet_avatar field
				newData.planet_avatar = path
			}
			// Database insert
			const locationResult = await supabase
				.from("locations")
				.insert(newData)
			if (locationResult.error) {
				throw new PostgrestError({
					message: locationResult.error.message,
					status: locationResult.status ?? 404
				})
			}
		} else {
			throw new AuthError("You are not authorized to add a new location.", 403)
		}
		return new Response("New location added successfully!", { status: 200 })
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
