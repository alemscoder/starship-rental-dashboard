import { z } from "astro:schema"
import { defineAction, ActionError } from "astro:actions"
import { uploadFile, deleteFiles } from "@lib/utils.server.ts"
import { createSupabaseAdmin, serverClient } from "@lib/server.ts"
import { newEmployeeSchema, editEmployeeSchema } from "@schema/employee.schema.ts"
import type { User } from "@supabase/supabase-js"

export const employee = {
	addEmployee: defineAction({
		accept: "form",
		input: newEmployeeSchema,
		handler: async (input, context) => {
			// Create an instance of supabase admin and server client
			const supabaseAdmin = createSupabaseAdmin()
			const supabaseServer = serverClient(context)
			/** Holds the details of the employee that has just been added */
			let newEmployee: User
			// Get the current user details
			const { data: { user }, error } = await supabaseServer.auth.getUser()
			if (error || !user) {
				throw new ActionError({ message: error?.message, code: "FORBIDDEN" })
			}
			if (user.app_metadata.role === "admin") {
				// Create new employee using Supabase admin client
				const { 
					data: employeeData, 
					error: employeeError 
				} = await supabaseAdmin.auth.admin.createUser({
					email: input.email,
					password: input.password,
					email_confirm: true,
					user_metadata: {
						first_name: input.first_name,
						last_name: input.last_name
					},
					app_metadata: { role: input.role }
				})
				if (employeeError) {
					throw new ActionError({ 
						message: employeeError.message, 
						code: "BAD_REQUEST" 
					})
				}
				newEmployee = employeeData.user
			} else {
				throw new ActionError({ 
					message: "You are not authorized to add a new employee.", 
					code: "UNAUTHORIZED" 
				})
			}
			if (!newEmployee) {
				throw new ActionError({ 
					message: "No employee data returned after insert.", 
					code: "NOT_FOUND" 
				})
			}
			// Prepare base `newData` without avatar field
			const newData: Record<string, any> = {
				id: newEmployee.id,
				email: input.email,
				first_name: input.first_name,
				last_name: input.last_name,
				job_title: input.job_title,
				role: input.role,
				phone: input.phone,
				status: "offline"
			}
			// Handle profile avatar file upload if provided
			if (input.profile_avatar instanceof File) {
				// The base filename
				const baseFileName = newEmployee.id.split("-")[0]
				// Generate a random number of 6 digits between 0 and 999999 for the filename
				const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
				// Upload avatar with pattern in filename
				const profileAvatarFile = input.profile_avatar
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
				throw new ActionError({
					message: employeeResult.error.message,
					code: "NOT_FOUND"
				})
			}
			return {
				message: "New employee added successfully!"
			}
		}
	}),
	editEmployee: defineAction({
		accept: "form",
		input: editEmployeeSchema,
		handler: async (input, context) => {
			// Create an instance of supabase admin and server client
			const supabaseAdmin = createSupabaseAdmin()
			const supabaseServer = serverClient(context)
			// Parse form data from the request
			const formData = await context.request.formData()
			const formEntries = Object.fromEntries(formData.entries())
			/** Holds the updated information for a user after an edit operation */
			let editedEmployee: User
			/** Indicates whether the admin client should be used for the current operation */
			let useAdminClient = false
			// Get the current user details
			const { data: { user }, error } = await supabaseServer.auth.getUser()
			if (error || !user) {
				throw new ActionError({ message: error?.message, code: "FORBIDDEN" })
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
						email: input.email,
						user_metadata: {
							first_name: input.first_name,
							last_name: input.last_name
						},
						app_metadata: { role: input.role }
					}
				)
				if (employeeError) {
					throw new ActionError({ 
						message: employeeError.message, 
						code: "BAD_REQUEST" 
					})
				}
				editedEmployee = employeeData.user
				useAdminClient = true
			} else if (user.id === formEntries.id) {
				// Regular user can only update their own data
				const { 
					data: employeeData, 
					error: employeeError 
				} = await supabaseServer.auth.updateUser({
					email: input.email,
					data: {
						first_name: input.first_name,
						last_name: input.last_name
					}
				})
				if (employeeError) {
					throw new ActionError({ 
						message: employeeError.message, 
						code: "BAD_REQUEST" 
					})
				}
				editedEmployee = employeeData.user
				useAdminClient = false
			} else {
				throw new ActionError({ 
					message: "You are not authorized to edit this employee.", 
					code: "UNAUTHORIZED" 
				})
			}
			if (!editedEmployee) {
				throw new ActionError({ 
					message: "No employee data returned after update.", 
					code: "NOT_FOUND" 
				})
			}
			// Prepare base `updateData`
			const updateData: Record<string, any> = {
				email: input.email,
				first_name: input.first_name,
				last_name: input.last_name,
				job_title: input.job_title,
				phone: input.phone
			}
			// Admin can update the role of the employee
			if (useAdminClient) {
				updateData.role = input.role
			}
			// Handle profile avatar only if it's being modified
			if (input.profile_avatar instanceof File) {
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
				const profileAvatarFile = input.profile_avatar
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
			} else if (input.profile_avatar === "") {
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
			if (input.profile_hero instanceof File) {
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
				const profileHeroFile = input.profile_hero
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
			} else if (input.profile_hero === "") {
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
				throw new ActionError({
					message: employeeResult.error.message,
					code: "NOT_FOUND"
				})
			}
			return {
				message: "Employee edited successfully!"
			}
		}
	}),
	deleteEmployee: defineAction({
		accept: "form",
		input: z.object({
			id: z.string(),
			profile_avatar: z.string().optional(),
			profile_hero: z.string().optional()
		}),
		handler: async (input, context) => {
			// Create an instance of supabase admin and server client
			const supabaseAdmin = createSupabaseAdmin()
			const supabaseServer = serverClient(context)
			// Get the current user details
			const { data: { user }, error } = await supabaseServer.auth.getUser()
			if (error || !user) {
				throw new ActionError({ message: error?.message, code: "FORBIDDEN" })
			}
			if (user.app_metadata.role === "admin") {
				// Delete the employee
				const { 
					error: employeeError 
				} = await supabaseAdmin.auth.admin.deleteUser(input.id)
				if (employeeError) {
					throw new ActionError({ 
						message: employeeError.message, 
						code: "BAD_REQUEST" 
					})
				}
				// Check if employee has profile avatar or profile hero for delete it
				const baseFileName = input.id.split("-")[0]
				if (input.profile_avatar) {
					await deleteFiles({
						context: context,
						bucket: "avatars",
						folderName: "profile_avatar",
						baseFileName: baseFileName,
					})
				}
				if (input.profile_hero) {
					await deleteFiles({
						context: context,
						bucket: "avatars",
						folderName: "profile_hero",
						baseFileName: baseFileName,
					})
				}
			} else {
				throw new ActionError({ 
					message: "You are not authorized to delete this employee.", 
					code: "UNAUTHORIZED" 
				})
			}
			return {
				message: "Employee deleted successfully!"
			}
		}
	})
}