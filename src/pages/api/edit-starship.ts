import { serverClient } from "@lib/server.ts"
import { formatZodErrors } from "@utils/zod.ts"
import { PostgrestError } from "@utils/errors.ts"
import { AuthError } from "@supabase/supabase-js"
import { StorageError } from "@supabase/storage-js"
import { starshipSchema } from "@schema/starship.schema.ts"
import { uploadFile, deleteFiles } from "@lib/utils.server.ts"
import type { APIRoute } from "astro"

export const POST: APIRoute = async (context) => {
	/** Create an instance of Supabase client */
	const supabase = serverClient(context)
	// Parse form data from the request
	const formData = await context.request.formData()
	const formEntries = Object.fromEntries(formData.entries())
	// Validate form data using Zod schema
	const parseResult = starshipSchema.partial().safeParse(formEntries)
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
			user.app_metadata.role === "manager"
		) {
			// Prepare base `updateData` without hero_image
			const updateData: Record<string, any> = {
				make: validatedData.make,
				model: validatedData.model,
				description: validatedData.description,
				year: validatedData.year,
				fuel_type: validatedData.fuel_type,
				license_plate: validatedData.license_plate,
				mileage: validatedData.mileage,
				status: validatedData.status,
			}
			// Handle hero image only if it's being modified
			if (validatedData.hero_image instanceof File) {
				// The base filename
				const baseFileName = (formEntries.id as string).split("-")[0]
				// Generate a random number of 6 digits between 0 and 999999 for the filename
				const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
				// Delete existing file before uploading new one
				await deleteFiles({
					context: context,
					bucket: "avatars",
					folderName: "starships",
					baseFileName: baseFileName
				})
				// Upload new file with pattern in filename
				const planetAvatarFile = validatedData.hero_image
				const fileExt = planetAvatarFile.name.split(".").pop()
				const fileName = `${baseFileName}-${randomNum}.${fileExt}`
				const filePath = `starships/${fileName}`
				const { path } = await uploadFile({
					context: context, 
					bucket: "avatars", 
					filePath: filePath, 
					file: planetAvatarFile,
					fileOptions: {
						upsert: true
					}
				})
				// Update the base `updateData` with the key-value of the new hero image
				updateData.hero_image = path
			} else if (validatedData.hero_image === "") {
				// Explicit hero image removal requested
				const baseFileName = (formEntries.id as string).split("-")[0]
				await deleteFiles({
					context: context,
					bucket: "avatars",
					folderName: "starships",
					baseFileName: baseFileName
				})
				updateData.hero_image = null
			}
			// Database update
			const starshipResult = await supabase
				.from("starships")
				.update(updateData)
				.eq("id", formEntries.id)
			if (starshipResult.error) {
				throw new PostgrestError({
					message: starshipResult.error.message,
					status: starshipResult.status ?? 404
				})
			}
		} else {
			throw new AuthError("You are not authorized to edit this starship.", 403)
		}
		return new Response("Starship edited successfully!", { status: 200 })
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
