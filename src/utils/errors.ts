interface PostgrestErrorOptions {
	/** The error message */
	message: string
	/** HTTP status code that caused the error. */
	status?: number
	/** Details about the row that caused the error */
	details?: string
	/** Suggestions or hints on how to resolve the error */
	hint?: string
	/** The PostgreSQL Standard SQL Error Code */
	code?: string
}

/**
 * Custom class for handle Postgrest errors.
 * @param PostgrestErrorOptions The options object.
 */
export class PostgrestError extends Error {
	status: number | undefined
	details: string | undefined
	hint: string | undefined
	code: string | undefined

	constructor(options: PostgrestErrorOptions) {
		super(PostgrestError.mapMessage(options))
		this.name = "PostgrestError"
		this.status = options.status ?? PostgrestError.mapStatus(options.code)
		this.details = options.details
		this.hint = options.hint
		this.code = options.code
	}

	/** Maps database error code + constraint to a human-friendly message */
	private static mapMessage(options: PostgrestErrorOptions): string {
		const { code, message } = options
		switch (code) {
			case "23503": // foreign_key_violation
				if (message?.includes("tickets_customer_id_fkey")) {
					return "The selected customer does not exist."
				}
				if (message?.includes("tickets_ship_id_fkey")) {
					return "The selected starship does not exist."
				}
				if (message?.includes("tickets_pickup_location_fkey")) {
					return "The selected pickup location does not exist."
				}
				if (message?.includes("tickets_return_location_fkey")) {
					return "The selected return location does not exist."
				}
				return "One of the referenced entities does not exist."
			case "23505": //unique_violation
				if (message?.includes("customers_email_key")) {
					return "The email entered is already in use."
				}
				return "A record with this value already exists."
			case "23514": // check_violation
				return "A check constraint failed."
			case "23502": // not_null_violation
				return "A required field is missing."
			case "22P02": // invalid_text_representation
				if (message?.includes("uuid")) {
					return "The provided ID is not a valid UUID."
				}
				return "Invalid input format."
			// PostgREST errors
			case "PGRST116":
				return "The requested record was not found."
			case "PGRST123":
				return "Invalid query syntax."
			case "PGRST301":
				return "Permission denied for this operation."
			default:
				return message || "Unexpected database error."
		}
	}

	/** Maps Postgres error codes to HTTP statuses */
	private static mapStatus(code?: string): number {
		switch (code) {
			// Postgres
			case "23503": return 400 // bad reference
			case "23505": return 409 // conflict
			case "22P02": return 400 // invalid format
			// Supabase/PostgREST
			case "PGRST116": return 404 // not found
			case "PGRST301": return 403 // forbidden
			default: return 500
		}
	}
}
