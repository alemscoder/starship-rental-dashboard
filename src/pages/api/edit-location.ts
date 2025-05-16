import { serverClient } from "@lib/server.ts"
import { formatZodErrors } from "@utils/zod.ts"
import { PostgrestError } from "@utils/errors.ts"
import { AuthError } from "@supabase/supabase-js"
import { StorageError } from "@supabase/storage-js"
import { locationSchema } from "@schema/location.schema.ts"
import { uploadFile, deleteFiles } from "@lib/utils.server.ts"
import type { APIRoute } from "astro"

export const POST: APIRoute = async (context) => {
	/** Create an instance of Supabase client */
	const supabase = serverClient(context)
	// Parse form data from the request
	const formData = await context.request.formData()
	const formEntries = Object.fromEntries(formData.entries())
	// Validate form data using Zod schema
	const parseResult = locationSchema.partial().safeParse(formEntries)
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
			// Prepare base `updateData` without planet_avatar and location_landscape fields
			const updateData: Record<string, any> = {
				name: validatedData.name,
				description: validatedData.description,
				coordinates: validatedData.coordinates,
				hours_of_operation: validatedData.hours_of_operation,
				employees: validatedData.employees,
				gravity: validatedData.gravity,
			}
			// Handle planet avatar only if it's being modified
			if (validatedData.planet_avatar instanceof File) {
				// The base filename
				const baseFileName = (formEntries.id as string).split("-")[0]
				// Generate a random number of 6 digits between 0 and 999999 for the filename
				const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
				// Delete existing file before uploading new one
				await deleteFiles({
					context: context,
					bucket: "avatars",
					folderName: "planets",
					baseFileName: baseFileName
				})
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
				// Update the base `updateData` with the key-value of the new planet avatar
				updateData.planet_avatar = path
			} else if (validatedData.planet_avatar === "") {
				// Explicit planet avatar removal requested
				const baseFileName = (formEntries.id as string).split("-")[0]
				await deleteFiles({
					context: context,
					bucket: "avatars",
					folderName: "planets",
					baseFileName: baseFileName
				})
				updateData.planet_avatar = null
			}
			// Handle location landscape only if it's being modified
			if (validatedData.location_landscape instanceof File) {
				// The base filename
				const baseFileName = (formEntries.id as string).split("-")[0]
				// Generate a random number of 6 digits between 0 and 999999 for the filename
				const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
				// Delete existing file before uploading new one
				await deleteFiles({
					context: context,
					bucket: "avatars",
					folderName: "location_landscapes",
					baseFileName: baseFileName
				})
				// Upload new file with pattern in filename
				const locationLandscapeFile = validatedData.location_landscape
				const fileExt = locationLandscapeFile.name.split(".").pop()
				const fileName = `${baseFileName}-${randomNum}.${fileExt}`
				const filePath = `location_landscapes/${fileName}`
				const { path } = await uploadFile({
					context: context, 
					bucket: "avatars", 
					filePath: filePath, 
					file: locationLandscapeFile,
					fileOptions: {
						upsert: true
					}
				})
				// Update the base `updateData` with the key-value of the new avatar
				updateData.location_landscape = path
			} else if (validatedData.location_landscape === "") {
				// Explicit location landscape removal requested
				const baseFileName = (formEntries.id as string).split("-")[0]
				await deleteFiles({
					context: context,
					bucket: "avatars",
					folderName: "location_landscapes",
					baseFileName: baseFileName
				})
				updateData.location_landscape = null
			}
			// Database update
			const locationResult = await supabase
				.from("locations")
				.update(updateData)
				.eq("id", formEntries.id)
			if (locationResult.error) {
				throw new PostgrestError({
					message: locationResult.error.message,
					status: locationResult.status ?? 404
				})
			}
		} else {
			throw new AuthError("You are not authorized to edit this location.", 403)
		}
		return new Response("Location edited successfully!", { status: 200 })
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
