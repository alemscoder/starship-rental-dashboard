import { formatZodErrors } from "@utils/zod.ts"
import { AuthError } from "@supabase/supabase-js"
import { PostgrestError } from "@utils/errors.ts"
import { StorageError } from "@supabase/storage-js"
import { uploadFile, deleteFiles } from "@lib/utils.server.ts"
import { editEmployeeSchema } from "@schema/employee.schema.ts"
import { createSupabaseAdmin, serverClient } from "@lib/server.ts"
import type { APIRoute } from "astro"
import type { User } from "@supabase/supabase-js"

export const POST: APIRoute = async (context) => {
	// Create an instance of supabase admin and server client
	const supabaseAdmin = createSupabaseAdmin()
	const supabaseServer = serverClient(context)
	// Parse form data from the request
	const formData = await context.request.formData()
	const formEntries = Object.fromEntries(formData.entries())
	// Validate form data using Zod schema
	const parseResult = editEmployeeSchema.safeParse(formEntries)
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
		/** Holds the updated information for a user after an edit operation */
		let editedEmployee: User
		/** Indicates whether the admin client should be used for the current operation */
		let useAdminClient = false
		// Get the current user details
		const { data: { user }, error } = await supabaseServer.auth.getUser()
		if (error || !user) {
			throw new AuthError(error?.message!, error?.status)
		}
		// Check if the role is admin to determine which update method to use
		if (user.app_metadata.role === "admin") {
			// update employee using Supabase admin client
			const { 
				data: employeeData, 
				error: employeeError 
			} = await supabaseAdmin.auth.admin.updateUserById(
				formEntries.id as string,
				{
					email: validatedData.email,
					user_metadata: {
						first_name: validatedData.first_name,
						last_name: validatedData.last_name
					},
					app_metadata: { role: validatedData.role }
				}
			)
			if (employeeError) {
				throw new AuthError(employeeError.message, employeeError.status)
			}
			editedEmployee = employeeData.user
			useAdminClient = true
		} else if (user.id === formEntries.id) {
			// Regular user can only update their own data
			const { 
				data: employeeData, 
				error: employeeError 
			} = await supabaseServer.auth.updateUser({
				email: validatedData.email,
				data: {
					first_name: validatedData.first_name,
					last_name: validatedData.last_name
				}
			})
			if (employeeError) {
				throw new AuthError(employeeError.message, employeeError.status)
			}
			editedEmployee = employeeData.user
			useAdminClient = false
		} else {
			throw new AuthError("You are not authorized to edit this employee.", 403)
		}
		if (!editedEmployee) {
			throw new AuthError("No employee data returned after update.", 500)
		}
		// Prepare base `updateData`
		const updateData: Record<string, any> = {
			email: validatedData.email,
			first_name: validatedData.first_name,
			last_name: validatedData.last_name,
			job_title: validatedData.job_title,
			phone: validatedData.phone
		}
		// Admin can update the role of the employee
		if (useAdminClient) {
			updateData.role = validatedData.role
		}
		// Handle profile avatar only if it's being modified
		if (validatedData.profile_avatar instanceof File) {
			// The base filename
			const baseFileName = (formEntries.id as string).split("-")[0]
			// Generate a random number of 6 digits between 0 and 999999 for the filename
			const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
			// Delete existing file before uploading new one
			await deleteFiles({
				context: context,
				bucket: "avatars",
				folderName: "profile_avatar",
				baseFileName: baseFileName
			})
			// Upload new avatar with pattern in filename
			const profileAvatarFile = validatedData.profile_avatar
			const fileExt = profileAvatarFile.name.split(".").pop()
			const fileName = `${baseFileName}-${randomNum}.${fileExt}`
			const filePath = `profile_avatar/${fileName}`
			const { path } = await uploadFile({
				context: context, 
				bucket: "avatars", 
				filePath: filePath, 
				file: profileAvatarFile,
				fileOptions: {
					upsert: true
				}
			})
			// Update the base `updateData` with the key-value of the new profile avatar
			updateData.profile_avatar = path
		} else if (validatedData.profile_avatar === "") {
			// Explicit profile avatar removal requested
			const baseFileName = (formEntries.id as string).split("-")[0]
			await deleteFiles({
				context: context,
				bucket: "avatars",
				folderName: "profile_avatar",
				baseFileName: baseFileName
			})
			updateData.profile_avatar = null
		}
		// Handle profile hero only if it's being modified
		if (validatedData.profile_hero instanceof File) {
			// The base filename
			const baseFileName = (formEntries.id as string).split("-")[0]
			// Generate a random number of 6 digits between 0 and 999999 for the filename
			const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
			// Delete existing file before uploading new one
			await deleteFiles({
				context: context,
				bucket: "avatars",
				folderName: "profile_hero",
				baseFileName: baseFileName
			})
			// Upload new hero with pattern in filename
			const profileHeroFile = validatedData.profile_hero
			const fileExt = profileHeroFile.name.split(".").pop()
			const fileName = `${baseFileName}-${randomNum}.${fileExt}`
			const filePath = `profile_hero/${fileName}`
			const { path } = await uploadFile({ 
				context: context,
				bucket: "avatars", 
				filePath: filePath, 
				file: profileHeroFile,
				fileOptions: {
					upsert: true
				}
			})
			// Update the base `updateData` with the key-value of the new profile hero
			updateData.profile_hero = path
		} else if (validatedData.profile_hero === "") {
			// Explicit profile avatar removal requested
			const baseFileName = (formEntries.id as string).split("-")[0]
			await deleteFiles({
				context: context,
				bucket: "avatars",
				folderName: "profile_hero",
				baseFileName: baseFileName
			})
			updateData.profile_hero = null
		}
		// Database update
		const employeeResult = await (useAdminClient ? supabaseAdmin : supabaseServer)
			.from("employees")
			.update(updateData)
			.eq("id", editedEmployee.id)
		if (employeeResult.error) {
			throw new PostgrestError({
				message: employeeResult.error.message,
				status: employeeResult.status ?? 404
			})
		}
		return new Response("Employee edited successfully!", { status: 200 })
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
		if (error instanceof StorageError) {
			return new Response(error.message, { status: 404 })
		}
		return new Response("An unexpected error occurred: " + error.message, { status: 500 })
	}
}
