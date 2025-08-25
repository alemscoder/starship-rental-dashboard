import { LRUCache } from "lru-cache"

/**
 * Options for rate limiting configuration.
 */
interface LimitOptions {
	/**
	 * Maximum number of allowed requests in the specified window.
	 */
	maxRequests: number
	/**
	 * Time window for rate limiting. Can be specified as a number in milliseconds
	 * or as a string with units, e.g. "2m" for 2 minutes, "30s" for 30 seconds.
	 */
	windowMs: number | string
}

/**
 * Cache storing counts of requests per IP address.
 * Keys are IP addresses, values are counts.
 */
const cache = new LRUCache<string, number>({ max: 500 })

/**
 * Parses a time value expressed either as a number in milliseconds or as a string
 * with units ("ms", "s", "m", "h") into milliseconds.
 *
 * @param value - Time value to parse.
 * @returns The parsed time in milliseconds.
 * @throws Throws if the format is invalid or unit unsupported.
 */
function parseWindowMs(value: number | string) {
	if (typeof value === "number") return value
	const match = /^(\d+)(ms|s|m|h)$/i.exec(value.trim())
	if (!match) throw new Error(`Invalid windowMs format: ${value}`)
	const amount = parseInt(match[1], 10)
	const unit = match[2].toLowerCase()
	switch (unit) {
		case "ms": return amount
		case "s": return amount * 1000
		case "m": return amount * 60_000
		case "h": return amount * 3_600_000
		default: throw new Error(`Unsupported unit: ${unit}`)
	}
}

/**
 * Rate limits requests by IP address within a time window.
 *
 * Increments the request count for the given IP and returns whether the IP
 * has exceeded the allowed number of requests.
 * @param ip - The IP address to rate limit.
 * @param options - Configuration options for rate limiting.
 * @returns An object containing:
 *  - `limited`: true if the rate limit was exceeded,
 *  - `count`: current count of requests in the window,
 *  - `windowMs`: window size in milliseconds.
 */
export function rateLimit(ip: string, { maxRequests, windowMs }: LimitOptions) {
	const windowMsValue = parseWindowMs(windowMs)
	const count = (cache.get(ip) || 0) + 1
	cache.set(ip, count, { ttl: windowMsValue })
	return {
		limited: count > maxRequests,
		count: count,
		windowMs: windowMsValue
	}
}
