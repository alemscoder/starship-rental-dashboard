import { html } from "lit-html"
import router from "@router/router.ts"
import { map } from "lit/directives/map.js"
import { browserClient } from "@lib/client.ts"
import { DialogBase } from "@base/dialogs/DialogBase.ts"
import { messagesStore } from "@store/gridData.store.ts"
import { userDataStore } from "@store/userData.store.ts"
import { markAsRead, getLastConversation } from "@controllers/messages.ts"
import { dialogHeaderRenderer, dialogRenderer } from "@vaadin/dialog/lit.js"
import type { Message } from "../../types.ts"
import "@styles/notifications-dialog.css"

/**
 * A dialog component that displays and manages user notifications.
 * Extends the DialogBase class to handle notification-specific functionality.
 * The dialog shows unread messages and provides options to mark them as read.
 * @extends {DialogBase}
 */
export class NotificationsDialog extends DialogBase {

	/**
	 * Supabase client instance for database operations.
	 * @protected
	 */
	protected supabase = browserClient()

	/**
	 * Initializes a new NotificationsDialog instance.
	 * Sets up the dialog trigger selector.
	 */
	constructor() {
		super(".drawer-nav vaadin-button.notifications")
	}

	protected getDialogId() {
		return "#notificationsDialog"
	}

	protected getDialogClass() {
		return "notifications"
	}

	/**
	 * Handles navigation when a notification item is clicked.
	 * Prevents default anchor behavior, navigates to the specified 
	 * path using the router, and closes the dialog.
	 * @protected
	 * @param event - The click event on the anchor element.
	 */
	protected handleAnchorNavigation(event: MouseEvent) {
		event.preventDefault()
		const anchor = event.currentTarget as HTMLAnchorElement
		const path = anchor.href
		router.navigate(path)
		this.closeDialog()
	}

	/**
	 * Checks if there are unread notifications for the currently logged-in user.
	 * 
	 * Evaluates messages in the `messagesStore` to determine if there are any unread
	 * messages where the user is either the sender or receiver.
	 * @protected
	 * @returns Returns `true` if unread notifications exist for the user,
	 * `false` if there are messages but none are unread,
	 * or `undefined` if either messages or user reference is not available
	 */
	protected hasNotification = () => {
		const messages = messagesStore.get()
		const loggedInUserReference = userDataStore.get()?.reference
		if (!messages || !loggedInUserReference) return
		return messages.some(message => {
			const isSender = message.sender_reference === loggedInUserReference
			const isReceiver = message.receiver_reference === loggedInUserReference
			return (isSender && message.sender_unread) || (isReceiver && message.receiver_unread)
		})
	}

	/**
	 * Marks all unread messages as read for the logged-in user.
	 * Updates the database records for both sent and received messages,
	 * then closes the dialog.
	 * @protected
	 * @returns A promise that resolves when all messages are updated.
	 */
	protected async markAllAsRead() {
		const messages = messagesStore.get()
		const loggedInUserReference = userDataStore.get()?.reference
		if (!messages || !loggedInUserReference) return
		for (const message of messages) {
			await markAsRead(this.supabase, message, loggedInUserReference)
		}
		this.closeDialog()
	}

	/**
	 * Renders a list of notification preview items for unread messages.
	 * 
	 * This method:
	 * 1. Filters the provided messages to show only those unread by the current user.
	 * 2. Map each unread message and determines if the user is sender or receiver.
	 * 3. Extracts relevant contact information for the other participant.
	 * 4. Retrieves the most recent conversation details using getLastConversation.
	 * 5. Generates a UI component for each message with avatar, name, timestamp, and message preview.
	 * 
	 * The resulting template creates clickable notification items that navigate
	 * to the corresponding message thread when selected. Each item displays
	 * the contact's information and a preview of the last message in the conversation.
	 * @protected
	 * @param messages - Array of message objects to process and render
	 * @returns A lit-html template containing list items for each unread notification
	 */
	protected renderNotificationPreview(messages: Message[]) {
		const loggedInUserReference = userDataStore.get()?.reference
		const unreadMessages = messages.filter(message => {
			const isSender = message.sender_reference === loggedInUserReference
			const isUnread = isSender ? message.sender_unread : message.receiver_unread
			return isUnread
		})
		return html`
			${map(unreadMessages, (message) => {
				const loggedInUserReference = userDataStore.get()?.reference
				const isSender = message.sender_reference === loggedInUserReference
				const contactInfo = isSender ? message.receiver : message.sender
				const fullName = `${contactInfo?.first_name} ${contactInfo?.last_name}`
				const abbr = `${contactInfo?.first_name[0]}${contactInfo?.last_name[0]}`
				const lastConversation = getLastConversation(message)
				return html`
					<li>
						<a 
							@click=${this.handleAnchorNavigation}
							class="flex flex-col gap-s p-m rounded-s" 
							href="/support/my-messages/${message.reference}">
							<div class="flex gap-m">
								<vaadin-avatar 
									theme="small" 
									name=${fullName}
									abbr=${abbr}>
								</vaadin-avatar>
								<div class="flex flex-col w-full gap-xs">
									<div class="flex items-baseline justify-between leading-xs">
										<div class="text-s font-bold text-body">
											${fullName}
										</div>
										<div class="text-xs text-secondary">
											${lastConversation?.time}
										</div>
									</div>
									<p class="text-s leading-s text-body m-0 last-message">
										${lastConversation?.text}
									</p>
								</div>
							</div>
						</a>
					</li>
				`
			})}
		`
	}

	/**
	 * Renders the dialog header.
	 * The button is disabled if there are no unread notifications.
	 * @protected
	 * @returns The lit-html template for the dialog header.
	 */
	protected renderHeader = () => html`
		<h2 class="text-m font-bold flex-auto">
			Notifications
		</h2>
		<vaadin-button
			@click=${this.markAllAsRead}
			?disabled=${!this.hasNotification()}
			theme="tertiary-inline" 
			class="text-s">
			Mark as Read
		</vaadin-button>
	`

	/**
	 * Renders the main content of the dialog.
	 * Shows notification previews if unread messages 
	 * exist, or an "Empty" message otherwise.
	 * @protected
	 * @returns The lit-html template for the dialog content.
	 */
	protected renderDialog = () => {
		return html`
			<ul class="flex flex-col list-none m-0 p-xs pt-0">
				${ 
					this.hasNotification() 
					? this.renderNotificationPreview(messagesStore.get()!) 
					: html`
							<li>
								<span class="flex flex-col p-l text-center">
									Empty
								</span>
							</li>
						` 
				}
			</ul>
		`
	}

	protected template() { 
		return html`
			<vaadin-dialog
				.overlayClass=${this.getDialogClass()}
				${dialogHeaderRenderer(() => this.renderHeader())}
				${dialogRenderer(() => this.renderDialog())}
				id=${this.getDialogId().slice(1)}
				theme="no-padding">
			</vaadin-dialog>
		`
	}

}
