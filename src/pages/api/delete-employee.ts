import { AuthError } from "@supabase/supabase-js"
import { deleteFiles } from "@lib/utils.server.ts"
import { StorageError } from "@supabase/storage-js"
import { createSupabaseAdmin, serverClient } from "@lib/server.ts"
import type { APIRoute } from "astro"

type RequestEntries = {
	id: string
	profile_avatar?: string
	profile_hero?: string
}

export const POST: APIRoute = async (context) => {
	// Create an instance of supabase admin and server client
	const supabaseAdmin = createSupabaseAdmin()
	const supabaseServer = serverClient(context)
	// Parse form data from the request
	const formData = await context.request.formData()
	const formEntries = Object.fromEntries(formData.entries()) as RequestEntries
	try {
		// Get the current user details
		const { data: { user }, error } = await supabaseServer.auth.getUser()
		if (error || !user) {
			throw new AuthError(error?.message!, error?.status)
		}
		if (user.app_metadata.role === "admin") {
			// Delete the employee
			const { 
				error: employeeError 
			} = await supabaseAdmin.auth.admin.deleteUser(formEntries.id)
			if (employeeError) {
				throw new AuthError(employeeError.message, employeeError.status)
			}
			// Check if employee has profile avatar or profile hero for delete it
			const baseFileName = formEntries.id.split("-")[0]
			if (formEntries.profile_avatar) {
				await deleteFiles({
					context: context,
					bucket: "avatars",
					folderName: "profile_avatar",
					baseFileName: baseFileName,
				})
			}
			if (formEntries.profile_hero) {
				await deleteFiles({
					context: context,
					bucket: "avatars",
					folderName: "profile_hero",
					baseFileName: baseFileName,
				})
			}
			return new Response("Employee deleted successfully!", { status: 200 })
		} else {
			throw new AuthError("You are not authorized to delete this employee.", 403)
		}
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
		return new Response("An unexpected error occurred: " + error.message, { status: 500 })
	}
}
