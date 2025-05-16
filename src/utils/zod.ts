import type { ZodError } from "astro:schema"

/**
 * Formats the errors from a Zod validation error into a structured object.
 * This function takes a `ZodError` object, extracts 
 * the error messages for each field, and returns an 
 * object where each field's key corresponds to an array
 * of its associated error messages.
 * @param zodError - The Zod error object containing validation errors.
 * @returns - A record where each key is a field name 
 * and the value is an array of error messages.
 */
export const formatZodErrors = (zodError: ZodError) => {
	const formattedErrors: Record<string, string[]> = {}
	const errors = zodError.format()
	Object.entries(errors).forEach(([key, value]: [string, any]) => {
		if (value?._errors?.length) {
			formattedErrors[key] = value._errors
		}
	})
	return formattedErrors
}
