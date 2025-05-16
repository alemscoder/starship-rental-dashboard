import { formatZodErrors } from "@utils/zod.ts"
import { uploadFile } from "@lib/utils.server.ts"
import { AuthError } from "@supabase/supabase-js"
import { PostgrestError } from "@utils/errors.ts"
import { StorageError } from "@supabase/storage-js"
import { newEmployeeSchema } from "@schema/employee.schema.ts"
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
	const parseResult = newEmployeeSchema.safeParse(formEntries)
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
		/** Holds the details of the employee that has just been added */
		let newEmployee: User
		// Get the current user details
		const { data: { user }, error } = await supabaseServer.auth.getUser()
		if (error || !user) {
			throw new AuthError(error?.message!, error?.status)
		}
		if (user.app_metadata.role === "admin") {
			// Create new employee using Supabase admin client
			const { 
				data: employeeData, 
				error: employeeError 
			} = await supabaseAdmin.auth.admin.createUser({
				email: validatedData.email,
				password: validatedData.password,
				email_confirm: true,
				user_metadata: {
					first_name: validatedData.first_name,
					last_name: validatedData.last_name
				},
				app_metadata: { role: validatedData.role }
			})
			if (employeeError) {
				throw new AuthError(employeeError.message, employeeError.status)
			}
			newEmployee = employeeData.user
		} else {
			throw new AuthError("You are not authorized to add a new employee.", 403)
		}
		if (!newEmployee) {
			throw new AuthError("No employee data returned after insert.", 500)
		}
		// Prepare base `newData` without avatar field
		const newData: Record<string, any> = {
			id: newEmployee.id,
			email: validatedData.email,
			first_name: validatedData.first_name,
			last_name: validatedData.last_name,
			job_title: validatedData.job_title,
			role: validatedData.role,
			phone: validatedData.phone,
			status: "offline"
		}
		// Handle profile avatar file upload if provided
		if (validatedData.profile_avatar instanceof File) {
			// The base filename
			const baseFileName = newEmployee.id.split("-")[0]
			// Generate a random number of 6 digits between 0 and 999999 for the filename
			const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
			// Upload avatar with pattern in filename
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
			// Update the base `newData` with the key-value of the profile avatar
			newData.profile_avatar = path
		}
		// Database insert
		const employeeResult = await supabaseAdmin
			.from("employees")
			.insert(newData)
		if (employeeResult.error) {
			throw new PostgrestError({
				message: employeeResult.error.message,
				status: employeeResult.status ?? 404
			})
		}
		return new Response("New employee added successfully!", { status: 200 })
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
