import { Toast } from "@components/Toast.ts"
import type { Message } from "../types"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Marks a message as read for either the sender or receiver based on the current user reference.
 * Updates the unread status in the database only if the message is currently marked as unread.
 * 
 * @param supabase - The Supabase client instance for database operations
 * @param message - The message object containing sender, receiver and unread status information
 * @param currentUserReference - The reference number of the current user
 * 
 * @throws Will throw and log an error if database update fails
 */
export async function markAsRead(
	supabase: SupabaseClient, 
	message: Message, 
	currentUserReference: number
) {
	const isSender = message.sender_reference === currentUserReference
	const isReceiver = message.receiver_reference === currentUserReference
	if ((isSender && !message.sender_unread) || 
		(isReceiver && !message.receiver_unread)) {
		return
	}
	try {
		const { error } = await supabase
			.from("messages")
			.update({ 
				...(isSender ? { sender_unread: false } : {}),
				...(isReceiver ? { receiver_unread: false } : {})
			})
			.eq("id", message.id)
		if (error) throw error
	} catch (error: any) {
		console.error("Error marking message as read:", error)
		Toast({ message: "Error updating message status" })
	}
}

/**
 * Retrieves the last conversation from a list of messages.
 *
 * @param messages - The messages object containing an array of conversations.
 * @returns An object with the `time` and `text` of the last conversation, or 
 * `null` if there are no conversations.
 */
export function getLastConversation(messages: Message) {
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
