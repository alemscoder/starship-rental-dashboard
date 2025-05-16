import type { Messages } from "../types.ts"

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
	}
	return defaultReturn
}

export function convertDateTime(datetime?: string) {
	const date = datetime ? new Date(datetime) : new Date()
	const options: Intl.DateTimeFormatOptions = datetime
		? { month: "short", day: "numeric", year: "numeric" }
		: { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" }
	return date.toLocaleDateString("en-US", options)
}

export function getLastConversation(messages: Messages) {
	const { conversations } = messages
	if (!conversations) return null
	if (conversations.length > 0) {
		const lastConversation = conversations[conversations.length - 1]
		return {
			time: lastConversation.time,
			text: lastConversation.text,
		}
	}
}

export function setGravityTheme(gravity: number) {
	if (gravity >= 0.30 && gravity <= 0.60) {
		return "contrast"
	} else if (gravity >= 0.61 && gravity <= 1.50) {
		return "accent"
	} else {
		return "error"
	}
}
