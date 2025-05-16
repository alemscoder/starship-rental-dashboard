import { html, render } from "lit-html"
import { Notification } from "@vaadin/notification"
import { ifDefined } from "lit-html/directives/if-defined.js"
import { notificationRenderer } from "@vaadin/notification/lit.js"
import type { ToastOptions } from "../types.ts"
import type { NotificationLitRenderer } from "@vaadin/notification/lit.js"
import "@styles/toast.css"

/**
 * Displays a toast notification.
 * @param options An object containing options to configure the Toast.
 */

export function Toast(options: ToastOptions) {

	/** Destructure options object */
	const { message, theme = "contrast", duration } = options

	/** Container for storing a reference of the toast */
	const toastContainer = document.createElement("div")
	toastContainer.setAttribute("class", "toast-container")
	document.body.appendChild(toastContainer)

	/** Handle the close method of the toast */
	const handleClose = () => {
		const toastNotification = toastContainer.querySelector("#toastNotification")
		if (toastNotification instanceof Notification) {
			toastNotification.close()
		}
	}

	/** Helper renderer function for the content of the toast */
	const renderer: NotificationLitRenderer = () => html`
		<vaadin-horizontal-layout theme="spacing" style="align-items: center;">
			<pre>${message}</pre>
			<vaadin-button theme="tertiary-inline" @click="${handleClose}" aria-label="Close">
				<vaadin-icon class="small" src="/close.svg"></vaadin-icon>
			</vaadin-button>
		</vaadin-horizontal-layout>
	`

	/** Template of the component */
	const template = html`
		<vaadin-notification
			duration=${ifDefined(duration)}
			theme=${theme}
			position="bottom-end"
			id="toastNotification"
			${notificationRenderer(renderer, [])}>
		</vaadin-notification>
	`

	/** Lit HTML render function */
	render(template, toastContainer)

	/** Storing a reference of the toast 
	and call the open() method */
	const toastNotification = toastContainer.querySelector("#toastNotification")
	if (toastNotification instanceof Notification) {
		toastNotification.open()
	}

	/** Observer for remove the toast container from the DOM 
	when the "vaadin-notification-container" leave the DOM */
	/** Target node to observe */
	const targetNode = document.body
	/** Options for the MutationObserver (observe changes 
	only in child nodes of the body element) */
	const observerOptions = { childList: true }
	/** Callback function to execute when a mutation is observed */
	const callback: MutationCallback = (mutationsList, observer) => {
		for (const mutation of mutationsList) {
			/** Check if a child node has been removed and if 
			it contains the "vaadin-notification-container" element */
			if (
				mutation.type === "childList" &&
				Array.from(mutation.removedNodes).some((node) =>
					node.nodeName === "VAADIN-NOTIFICATION-CONTAINER",
				)
			) {
				/** Remove the ".toast-container" element from the DOM if present */
				const toastContainer = document.querySelector(".toast-container")
				toastContainer?.remove()
				/** Stop the observer */
				observer.disconnect()
			}
		}
	}
	/** Create a new instance of MutationObserver 
	with the callback function and options */
	const observer = new MutationObserver(callback)
	/** Start observing the target node 
	with the specified options */
	observer.observe(targetNode, observerOptions)

}
