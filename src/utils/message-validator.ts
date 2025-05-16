import type { MessageValidationConfig } from '../types.ts'

/** Shared state for rate limiting */
const messageCounters: Map<string, number[]> = new Map()

/** Default configuration */
const defaultConfig: MessageValidationConfig = {
	maxLength: 2000,
	minLength: 1,
	rateLimit: {
		maxMessages: 10,
		timeWindowMs: 60000
	}
}

/**
 * Validates a message content against configured length constraints.
 * 
 * @param content - The message content to validate
 * @param config - Optional partial configuration to override default settings
 * @returns An object indicating if the message is valid, with an error message if invalid
 * 
 * @example
 * // Using default configuration
 * const result = validateMessageContent("Hello world");
 * 
 * @example
 * // Using custom configuration
 * const result = validateMessageContent("Hello", { minLength: 10 });
 * if (!result.isValid) {
 *   console.error(result.validationError);
 * }
 */
export function validateMessageContent(
	content: string, 
	config: Partial<MessageValidationConfig> = {}
): { isValid: boolean, validationError?: string } {
	const finalConfig = { ...defaultConfig, ...config }
	if (content.length > finalConfig.maxLength) {
		return { 
			isValid: false, 
			validationError: `Message exceeds maximum length of ${finalConfig.maxLength} characters` 
		}
	}
	if (content.length < finalConfig.minLength) {
		return { 
			isValid: false, 
			validationError: `Message must be at least ${finalConfig.minLength} character` 
		}
	}
	return { isValid: true }
}

/**
 * Checks if a user has exceeded their rate limit for sending messages.
 * Tracks message timestamps and enforces configured rate limits.
 * 
 * @param userId - Unique identifier for the user being rate limited
 * @param config - Optional partial configuration to override default settings
 * @returns Boolean indicating if the user is within rate limits (true) or has exceeded them (false)
 * 
 * @example
 * // Using default rate limit configuration
 * if (checkRateLimit("user123")) {
 *   // User is within rate limits, proceed with message
 * } else {
 *   // User has exceeded rate limits
 * }
 * 
 * @example
 * // Using custom rate limit configuration
 * const strictLimits = { 
 *   rateLimit: { maxMessages: 5, timeWindowMs: 30000 }
 * };
 * const canSendMessage = checkRateLimit("user123", strictLimits);
 */
export function checkRateLimit(
	userId: string,
	config: Partial<MessageValidationConfig> = {}
): boolean {
	const finalConfig = { ...defaultConfig, ...config }
	const now = Date.now()
	const userMessages = messageCounters.get(userId) || []
	const recentMessages = userMessages.filter(
		timestamp => now - timestamp < finalConfig.rateLimit.timeWindowMs
	)
	if (recentMessages.length >= finalConfig.rateLimit.maxMessages) {
		return false
	}
	recentMessages.push(now)
	messageCounters.set(userId, recentMessages)
	return true
}
