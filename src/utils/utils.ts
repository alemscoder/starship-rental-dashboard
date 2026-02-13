/**
 * Processes a status string and returns an object containing a 
 * theme badge and a formatted status text.
 *
 * @param status - The status string to process.
 * @returns An object with `themeBadge` and `statusText`.
 */
export function processStatusBadge(status: string | undefined) {
	const defaultReturn = { themeBadge: "contrast", statusText: "Unknown" }
	if (!status) return defaultReturn
	const capitalizeFirstLetter = status.charAt(0).toUpperCase() + status.slice(1)
	if (status === "confirmed" || status === "available" || status === "online") {
		return { themeBadge: "success", statusText: capitalizeFirstLetter }
	} else if (status === "pending" || status === "maintenance") {
		return { themeBadge: "warning", statusText: capitalizeFirstLetter }
	} else if (status === "cancelled" || status === "rented" || status === "offline") {
		return { themeBadge: "error", statusText: capitalizeFirstLetter }
	} else if (status === "refunded") {
		return { themeBadge: "accent", statusText: capitalizeFirstLetter }
	}
	return defaultReturn
}

/**
 * Converts a date-time string to a formatted date string in "en-US" locale.
 * If no date-time string is provided, uses the current date and time.
 *
 * The returned string includes the month (short), day (numeric), year (numeric),
 * hour (numeric), and minute (numeric).
 *
 * @param datetime - An optional ISO date-time string to convert.
 * @returns The formatted date string.
 */
export function convertDateTime(datetime?: string) {
		const date = datetime ? new Date(datetime) : new Date()
		const options: Intl.DateTimeFormatOptions = {
				month: "short", 
				day: "numeric", 
				year: "numeric", 
				hour: "numeric", 
				minute: "numeric"
		}
		return date.toLocaleDateString("en-US", options)
}

/**
 * Determines the theme based on the provided gravity value.
 *
 * - Returns `"contrast"` if gravity is between 0.30 and 0.60 (inclusive).
 * - Returns `"accent"` if gravity is between 0.61 and 1.50 (inclusive).
 * - Returns `"error"` for any other gravity value.
 *
 * @param gravity - The gravity value to evaluate.
 * @returns The theme string corresponding to the gravity range.
 */
export function setGravityTheme(gravity: number) {
	if (gravity >= 0.30 && gravity <= 0.60) {
		return "contrast"
	} else if (gravity >= 0.61 && gravity <= 1.50) {
		return "accent"
	} else {
		return "error"
	}
}

/**
 * Converts a PostgreSQL timestamp (string or Date) to a `datetime-local` formatted string.
 *
 * The output format is `YYYY-MM-DDTHH:mm`, suitable for HTML `<input type="datetime-local">`.
 * Throws an error if the input is not a valid date.
 *
 * @param pgTimestamp - The PostgreSQL timestamp as a string or Date object.
 * @returns The formatted `datetime-local` string.
 * @throws {Error} If the input is not a valid date.
 */
export function pgToDatetimeLocal(pgTimestamp: string | Date) {
	const date = new Date(pgTimestamp)
	if (isNaN(date.getTime())) {
		throw new Error("Invalid date: " + pgTimestamp)
	}
	const pad = (n: number) => String(n).padStart(2, "0")
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Converts a local datetime string to a PostgreSQL-compatible UTC timestamp string.
 *
 * The returned string is formatted as `YYYY-MM-DD HH:mm:ss.SSSSSS+00`.
 * If the input is invalid, an error is thrown.
 *
 * @param datetimeLocal - The local datetime string to convert.
 * @returns The formatted PostgreSQL UTC timestamp string.
 * @throws {Error} If the input date string is invalid.
 */
export function toPostgresTimestamp(datetimeLocal: string | undefined) {
	if (datetimeLocal) {
		const date = new Date(datetimeLocal)
		if (isNaN(date.getTime())) {
			throw new Error("Invalid date: " + datetimeLocal)
		}
		const pad = (n: number, size = 2) => String(n).padStart(size, "0")
		const year = date.getUTCFullYear()
		const month = pad(date.getUTCMonth() + 1)
		const day = pad(date.getUTCDate())
		const hours = pad(date.getUTCHours())
		const minutes = pad(date.getUTCMinutes())
		const seconds = pad(date.getUTCSeconds())
		const millis = pad(date.getUTCMilliseconds(), 6)
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${millis}+00`
	}
}

/**
 * Generates a SQL select string for querying ticket information, including related customer,
 * starship, pickup location, and return location details.
 *
 * @returns A SQL select clause string for ticket queries with joined entities.
 */
export function getTicketSelect() {
	return `
		id, created_at, reference, pickup_date, return_date, status, total_cost, rent_duration,
		customer:customers (id, reference, first_name, last_name, nationality, language, age, email, phone, address),
		starship:starships (id, reference, make, model, year, fuel_type, mileage),
		pickup_location:locations!tickets_pickup_location_fkey (id, name, reference),
		return_location:locations!tickets_return_location_fkey (id, name, reference)
	`;
}
