import { html } from "lit-html"
import router from "@router/router.ts"
import { Toast } from "@components/Toast.ts"
import { convertDateTime } from "@utils/utils.ts"
import { markAsRead } from "@controllers/messages.ts"
import { messagesStore } from "@store/gridData.store.ts"
import { DetailsBase } from "@base/panel/DetailsBase.ts"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { MessagesGrid } from "@components/grids/MessagesGrid.ts"
import { SupportSideNav } from "@pages/support/SupportSideNav.ts"
import { checkRateLimit, validateMessageContent } from "@utils/message-validator.ts"
import type { Button } from "@vaadin/button"
import type { Message } from "../../types.ts"
import type { Scroller } from "@vaadin/scroller"
import type { MessageListItem } from "@vaadin/message-list"
import type { MessageInputSubmitEvent } from "@vaadin/message-input"
import "@styles/messages-details.css"

export class MessageDetails extends DetailsBase<Message> {

	static #instance: MessageDetails
	#newMessageCount = 0

	constructor() {
		super(".messages-view")
		this.initialize()
		if (!!MessageDetails.#instance) {
			return MessageDetails.#instance
		}
		MessageDetails.#instance = this
	}

	static getInstance() {
		if (!MessageDetails.#instance) {
			new MessageDetails()
		}
		return MessageDetails.#instance
	}

	protected async initialize() {
		await MessagesGrid.getInstance().waitForInitialization()
		this.data = this.getDataByReference()
		MessagesGrid.getInstance().setGridActiveItem(this.data)
		this.render()
		this.setSenderClass()
		this.scrollerUpdate()
		this.checkUnreadMessage()
	}

	protected getRecordsStore() {
		return messagesStore 
	}

	protected getMessageList() {
		return document.querySelector("vaadin-message-list")
	}

	protected getMessageListItems() {
		return document.querySelectorAll("vaadin-message")
	}

	protected getScrollerContainer(): Scroller | null {
		return document.querySelector("vaadin-scroller#messageDetails")
	}

	protected closeDetails() {
		MessagesGrid.getInstance().setGridActiveItem(null)
		router.navigate(MessagesGrid.getInstance().getGridUrlRoute())
	}

	public updateDetails(messageDetails: Message) {
		const messageList = this.getMessageList()
		if (messageList) {
			const currentItems = messageList.items
			const newConversations = messageDetails.conversations
			if (currentItems?.length === newConversations?.length) return
			console.log("Updating details conversation")
			messageList.items = newConversations
			this.setSenderClass()
			this.scrollerUpdate(true)
		}
	}

	/**
	 * Handles the submission of a new message in the chat interface.
	 * 
	 * This method performs the following operations:
	 * 1. Validates user authentication and message list availability.
	 * 2. Checks rate limiting for the user.
	 * 3. Validates message content.
	 * 4. Creates and optimistically adds new message to UI.
	 * 5. Persists message to backend via Supabase RPC.
	 * 6. Handles error cases and rollbacks if needed.
	 * 
	 * @protected
	 * @param event - The message input submit event containing the message content
	 * @throws {Error} When message fails to send or user is unauthorized
	 */
	protected handleSubmit = async (event: MessageInputSubmitEvent) => {
		const loggedInUserReference = this.loggedInUserData?.reference
		const messageList = this.getMessageList()
		// Early return if no message list or user reference
		if (!messageList || !loggedInUserReference) {
			Toast({ message: "Unable to send message. Please try again." })
			return
		}
		// Rate limit check
		if (!checkRateLimit(loggedInUserReference.toString())) {
			Toast({
				message: "You are sending messages too quickly. Please wait a moment.",
			})
			return
		}
		// Message content validation
		const { isValid, validationError } = validateMessageContent(event.detail.value)
		if (!isValid) {
			Toast({ message: validationError! })
			return
		}
		// Create the new message object
		const newMessage = {
			text: event.detail.value,
			time: convertDateTime(),
			userName: loggedInUserReference.toString(),
			className: "sender",
		}
		try {
			// Optimistically update UI
			const previousItems = messageList.items || []
			const updatedItems = [...previousItems, newMessage]
			messageList.items = updatedItems
			if (this.data) this.data.conversations = updatedItems
			this.scrollToBottom()
			// Make API call to persist the message
			const { data, error } = await this.supabase.rpc(
				"append_to_conversations",
				{
					message_id: this.data?.id!,
					user_reference: loggedInUserReference,
					new_message: {
						text: event.detail.value,
						time: newMessage.time,
						userName: loggedInUserReference.toString(),
					},
				},
			)
			// Handle API errors
			if (error) {
				// Rollback optimistic update
				messageList.items = previousItems
				if (this.data) this.data.conversations = previousItems
				throw error
			}
			// Validate server response
			if (!data) {
				// Rollback optimistic update if server returns false
				messageList.items = previousItems
				if (this.data) this.data.conversations = previousItems
				throw new Error("Failed to send message - unauthorized user")
			}
		} catch (error) {
			console.error("Message send error:", error)
			Toast({
				message: "Failed to send message. Please try again."
			})
		}
	}

	/**
	 * Assigns the "sender" CSS class to message list items that belong to the logged-in user.
	 * Iterates through all message list items and compares each item's `userName` property
	 * with the logged-in user's reference. If they match, the item's `className` is set to "sender";
	 * otherwise, it is cleared.
	 *
	 * @protected
	 */
	protected setSenderClass() {
		const messageListItems = this.getMessageListItems()
		const loggedInUserReference = this.loggedInUserData?.reference.toString()
		Array.from(messageListItems).forEach((item: MessageListItem) => {
			if (item.userName === loggedInUserReference) {
				item.className = "sender"
			} else {
				item.className = ""
			}
		})
	}

	/**
	 * Toggles the visibility of the scroll-to-bottom button in the message details panel.
	 *
	 * @protected
	 * @param show - Whether to show (`true`) or hide (`false`) the scroll button.
	 * @param messageCount - Optional. The number of new messages to display on the button. 
	 * If provided and greater than zero, the button text will indicate the number of new 
	 * messages; otherwise, it defaults to "Scroll to bottom".
	 */
	protected toggleScrollButton(show: boolean, messageCount?: number) {
		const button = document.querySelector<Button>("#messageDetails > .scroll-bottom-button")
		if (!button) return
		if (!show) {
			if (!button.classList.contains("visible")) return
			button.classList.remove("visible")
			return
		}
		button.textContent = messageCount 
			? `${messageCount} new message${messageCount > 1 ? "s" : ""}` 
			: "Scroll to bottom"
		button.classList.add("visible")
	}

	/**
	 * Updates the scroll state of the message panel and manages the visibility 
	 * of the scroll button.
	 *
	 * - If a new message arrives and the user is near the bottom, scrolls 
	 * 		to the bottom automatically.
	 * - If a new message arrives and the user is not near the bottom, increments 
	 * 		the new message count and shows the scroll button.
	 * - If not a new message and the user is not near the bottom, shows the 
	 * 		scroll button with the current new message count.
	 * - If the user is at the bottom, resets the new message count and hides 
	 * 		the scroll button.
	 *
	 * @protected
	 * @param isNewMessage - Indicates whether the update is due to a new message 
	 * being added. Defaults to `false`.
	 */
	protected scrollerUpdate = (isNewMessage = false) => {
		const scrollerContainer = this.getScrollerContainer()
		if (scrollerContainer) {
			const { scrollTop, scrollHeight, clientHeight } = scrollerContainer
			const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100
			if (isNewMessage && isNearBottom) {
				this.scrollToBottom()
			} else if (isNewMessage && !isNearBottom) {
				this.#newMessageCount++
				this.toggleScrollButton(true, this.#newMessageCount)
			} else if (!isNearBottom) {
				this.toggleScrollButton(true, this.#newMessageCount > 0 ? this.#newMessageCount : undefined)
			} else {
				if (scrollTop + clientHeight >= scrollHeight) {
					this.#newMessageCount = 0
					this.toggleScrollButton(false)
				}
			}
		}
	}

	/**
	 * Scrolls the message container to the bottom.
	 *
	 * If the user is already at the bottom of the container, resets
	 * the new message count and hides the scroll button. Otherwise,
	 * scrolls the container to its maximum scroll height.
	 *
	 * @protected
	 * @protected
	 */
	protected scrollToBottom = () => {
		const scrollerContainer = this.getScrollerContainer()
		if (scrollerContainer) {
			const { scrollTop, scrollHeight, clientHeight } = scrollerContainer
			if (scrollTop + clientHeight >= scrollHeight) {
				this.#newMessageCount = 0
				this.toggleScrollButton(false)
				return
			}
			scrollerContainer.scrollTop = scrollerContainer.scrollHeight
		}
	}

	protected async checkUnreadMessage() {
		const loggedInUserReference = this.loggedInUserData?.reference
		if (this.data && loggedInUserReference) {
			await markAsRead(this.supabase, this.data, loggedInUserReference)
		}
	}

	protected toggleFavoriteMessage = () => {
		this.toggleFavorites("favMessage")
		SupportSideNav.getInstance().initializeFavorites()
		SupportSideNav.getInstance().render()
	}

	protected isMessageFavorite = () => {
		return this.isFavorite("favMessage")
	}

	protected showUserProfile = () => {
		const loggedInUserReference = this.loggedInUserData?.reference
		const isSender = this.data?.sender_reference === loggedInUserReference
		const userReference = isSender ? this.data?.receiver_reference : this.data?.sender_reference
		if (userReference) {
			router.navigate(`/settings/employees/${userReference}`)
		}
	}

	protected headerTemplate = () => {
		const loggedInUserReference = this.loggedInUserData?.reference
		const isSender = this.data?.sender_reference === loggedInUserReference
		const contactInfo = isSender ? this.data?.receiver : this.data?.sender
		const fullName = `${contactInfo?.first_name} ${contactInfo?.last_name}`
		return html`
			${HeaderSection({
				templateContent: html`
					<vaadin-button 
						@click=${this.closeDetails} 
						class="back" 
						theme="icon tertiary contrast">
						<vaadin-icon src="/arrow-left.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text="Back">
						</vaadin-tooltip>
					</vaadin-button>
					<h2>${fullName}</h2>
					<vaadin-button
						@click=${this.toggleFavoriteMessage}
						theme="icon tertiary contrast">
						<vaadin-icon 
							src=${this.isMessageFavorite() ? "/star-filled.svg" : "/star.svg"}>
						</vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text=${this.isMessageFavorite() ? "Remove from favorites" : "Add to favorites"}>
						</vaadin-tooltip>
					</vaadin-button>
					<vaadin-button
						@click=${this.showUserProfile}
						theme="icon tertiary contrast">
						<vaadin-icon src="/info.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text="Show User Profile">
						</vaadin-tooltip>
					</vaadin-button>
					<vaadin-button 
						@click=${this.closeDetails} 
						class="close" 
						theme="icon tertiary contrast">
						<vaadin-icon src="/close.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text="Close">
						</vaadin-tooltip>
					</vaadin-button>
				`
			})}
		`
	}

	protected bodyTemplate = () => {
		return html`
			<vaadin-scroller
				@scroll=${() => this.scrollerUpdate()} 
				id="messageDetails" 
				theme="overflow-indicators" 
				class="View-content">
				<vaadin-message-list
					.items=${this.data?.conversations}
					class="one-to-one">
				</vaadin-message-list>
				<vaadin-button
					@click=${this.scrollToBottom}
					class="scroll-bottom-button"
					theme="primary small">
					Scroll to bottom
				</vaadin-button>
			</vaadin-scroller>
		`
	}

	protected footerTemplate = () => {
		return html`
			<footer class="View-footer">
				<vaadin-message-input
					@submit=${this.handleSubmit} 
					class="p-m">
				</vaadin-message-input>
			</footer>
		`
	}

}
