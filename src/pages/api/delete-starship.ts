import { serverClient } from "@lib/server.ts"
import { PostgrestError } from "@utils/errors.ts"
import { AuthError } from "@supabase/supabase-js"
import { deleteFiles } from "@lib/utils.server.ts"
import { StorageError } from "@supabase/storage-js"
import type { APIRoute } from "astro"

type RequestEntries = {
	id: string
	hero_image?: string
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
			// Delete the starship
			const starshipResult = await supabase
				.from("starships")
				.delete()
				.eq("id", formEntries.id)
			if (starshipResult.error) {
				throw new PostgrestError({
					message: starshipResult.error.message,
					status: starshipResult.status ?? 404
				})
			}
			// Check if starship has hero image for delete it
			const baseFileName = formEntries.id.split("-")[0]
			if (formEntries.hero_image) {
				await deleteFiles({
					context: context,
					bucket: "avatars",
					folderName: "starships",
					baseFileName: baseFileName,
				})
			}
		} else {
			throw new AuthError("You are not authorized to delete this starship.", 403)
		}
		return new Response("Starship deleted successfully!", { status: 200 })
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
