import router from "@router/router.ts"
import { html, nothing } from "lit-html"
import { Badge } from "@components/Badge.ts"
import { messagesStore } from "@store/gridData.store.ts"
import { userDataStore } from "@store/userData.store.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import { MessagesGrid } from "@components/grids/MessagesGrid.ts"
import { addUnsubscribe, unsubscribeStore } from "@store/unsubscribe.store.ts"
import type { Context } from "@thepassle/app-tools/router.js"

/**
 * Represents the Notifications component.
 * 
 * This component manages the logic and rendering of notifications in the web application.
 * It includes functionality for subscribing to message updates, determining unread notifications,
 * and rendering a notification badge dynamically. The component also provides a button to open
 * the Notifications dialog.
 */
export function Notifications() {

	/**
	 * Opens the Notifications dialog.
	 * 
	 * This function dynamically imports the `NotificationsDialog` component,
	 * creates an instance of it, and opens the dialog.
	 * @async
	 * @returns A promise that resolves when the dialog is opened.
	 */
	const openNotificationsDialog = async () => {
		const { NotificationsDialog } = await import("./dialogs/NotificationsDialog.ts")
		const notificationsDialog = new NotificationsDialog()
		notificationsDialog.open()
	}

	/**
	 * Subscribes to changes in the messages store to handle notifications.
	 * 
	 * This function listens for updates in the `messagesStore` and determines
	 * whether a notification badge should be rendered based on the changes.
	 * It ensures that notifications are only rendered for relevant message updates.
	 * 
	 * ### Notification Rendering Logic:
	 * The following cases determine when a notification is rendered:
	 * 1. **Initial Load**:
	 *    - When `oldMessages` is `undefined` (initial load), a notification is rendered.
	 * 2. **Change in Message Count in Current Conversation**:
	 *    - If the user is viewing a specific conversation (`urlReference` matches the message reference)
	 *      and the number of messages in that conversation changes, no notification is rendered.
	 * 3. **Change in Message Count in Other Conversations**:
	 *    - If the change occurs in a conversation other than the one being viewed,
	 *      a notification is rendered.
	 * 4. **No Change in Message Count**:
	 *    - If there are no changes in the number of messages, no notification is rendered.
	 * 5. **Message Marked as Read**:
	 *    - If unread messages are marked as read, notifications are updated accordingly:
	 *      - A notification is rendered if there are still unread messages.
	 *      - No notification is rendered if all messages are read.
	 * @async
	 * @returns A promise that resolves when the subscription is set up.
	 */
	const subscribeNotifications = async () => {
		await MessagesGrid.getInstance().waitForInitialization()
		if (!unsubscribeStore.get()["subscribeNotifications"]) {
			const unsubscribe = messagesStore.subscribe((newMessages, oldMessages) => {
				const urlReference = (router.context as Context).params.reference
				const newMessage = newMessages?.find((message) => message.reference.toString() === urlReference)
				const oldMessage = oldMessages?.find((message) => message.reference.toString() === urlReference)
				const areConversationLengthsEqual = newMessage?.conversations?.length === oldMessage?.conversations?.length
				const messageReference =  newMessage?.reference.toString()
				if (
					urlReference && 
					oldMessage && 
					!areConversationLengthsEqual && 
					urlReference === messageReference
				) return
				renderNotificationBadge()
			})
			addUnsubscribe("subscribeNotifications", unsubscribe)
		}
	}
	subscribeNotifications()

	/**
	 * Checks if there are unread notifications for the currently logged-in user.
	 * 
	 * Evaluates messages in the `messagesStore` to determine if there are any unread
	 * messages where the user is either the sender or receiver.
	 * @returns Returns `true` if unread notifications exist for the user,
	 * `false` if there are messages but none are unread,
	 * or `undefined` if either messages or user reference is not available
	 */
	const hasNotification = () => {
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
	 * Renders the notification badge if there are unread notifications.
	 * 
	 * This function uses the `observeAndRender` utility to dynamically render
	 * a notification badge if the `hasNotification` function returns `true`.
	 */
	const renderNotificationBadge = () => {
		observeAndRender({
			template: hasNotification() ? Badge({
				theme: "small primary error",
				className: "absolute top-xs start-l",
				"aria-label": "Unread notifications"
			}) : nothing,
			targetSelector: "vaadin-button.notifications",
			renderOptions: { 
				renderBeforeSelector: "vaadin-tooltip",
				renderBefore: undefined
			}
		})
	}

	/**
	 * Defines the template for the Notifications button.
	 * 
	 * This function returns the HTML template for the `vaadin-button` 
	 * element, which includes an icon and a tooltip. The button triggers 
	 * the `openNotificationsDialog` function when clicked.
	 * @returns The HTML template for the Notifications button.
	 */
	const template = () => {
		const isRootPathname = location.pathname === "/"
		return html`
			<vaadin-button
				@click=${openNotificationsDialog}
				theme="tertiary contrast ${isRootPathname ? "" : "icon"}" 
				class="notifications unread ${isRootPathname ? "w-full" : ""}">
				<vaadin-icon
					slot=${isRootPathname ? "prefix" : ""} 
					src="/notification.svg">
				</vaadin-icon>
				${ isRootPathname 
					? html`<div>Notifications</div>`
					: html`
						<vaadin-tooltip 
							slot="tooltip" 
							text="Notifications" 
							position="start">
						</vaadin-tooltip>
					`
				}
			</vaadin-button>
		`
	}

	/**
	 * Renders the Notifications button.
	 * 
	 * This function uses the `observeAndRender` utility to dynamically render
	 * the Notifications button inside the `.drawer-nav` element.
	 */
	const render = () => {
		observeAndRender({
			template: template(),
			targetSelector: ".drawer-nav",
			renderOptions: { 
				renderBeforeSelector: "hr",
				renderBefore: undefined
			}
		})
	}
	render()

}
