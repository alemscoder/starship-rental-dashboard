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
		super(options.message)
		this.name = 'PostgrestError'
		this.status = options.status
		this.details = options.details
		this.hint = options.hint
		this.code = options.code
	}
}
