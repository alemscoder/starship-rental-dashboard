import { Redis } from "@upstash/redis"
import { createHash } from "node:crypto"
import { Ratelimit } from "@upstash/ratelimit"
import type { ActionAPIContext } from "astro:actions"

/**
 * Checks if a given IP address has exceeded the rate limit.
 * Uses Upstash Redis and a sliding window rate limiter to restrict excessive API requests.
 * 
 * @param context - The API context containing client request details.
 * @returns A promise that resolves to `true` if the request is rate-limited, `false` otherwise.
 */
export async function checkIfRateLimited(context: ActionAPIContext) {
	try {
		const ip = context.clientAddress || "127.0.0.1"
		const redis = new Redis({
			url: import.meta.env.UPSTASH_REDIS_REST_URL,
			token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
		})
		const ipHash = createHash("sha256").update(ip).digest("hex")
		const ratelimit = new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(60, "60 s"),
			analytics: true,
		})
		const { success } = await ratelimit.limit(ipHash)
		return !success
	} catch (error) {
		console.error(error)
	}
}
