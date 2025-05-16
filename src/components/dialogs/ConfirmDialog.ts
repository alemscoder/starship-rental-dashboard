import { html, nothing, render } from "lit-html"
import type { ConfirmDialogOptions } from "../../types.ts"

/**
 * Creates and displays a confirmation dialog with customizable header, message, and confirm button.
 * This function returns a Promise that resolves with either the event type ("confirm" or "cancel") 
 * based on the user's action.
 * 
 * @param options - An object containing options to configure the confirm dialog.
 * @returns A promise that resolves with the type of action the user took ("confirm" or "cancel").
 * 
 * @example
 * ConfirmDialog({
 *   header: "Delete employee",
 *   message: "Are you sure you want to delete this item?",
 *   confirmText: "Delete",
 *   confirmTheme: "error"
 * }).then(action => {
 *   if (action === "confirm") {
 *     // User confirmed the action
 *   } else if (action === "cancel") {
 *     // User cancelled the action
 *   }
 * })
 */
export function ConfirmDialog(options: ConfirmDialogOptions): Promise<string> {

	const { 
		header, 
		message, 
		confirmText, 
		confirmTheme,
		overlayClass, 
		cancelButton = true, 
		closeOnEsc = false 
	} = options

	const confirmDialogContainer = document.createElement("div")
	confirmDialogContainer.setAttribute("id", "confirm-dialog-container")
	document.body.appendChild(confirmDialogContainer)

	const cleanContainer = () => {
		render(nothing, confirmDialogContainer)
		confirmDialogContainer.remove()
	}

	return new Promise((resolve) => {

		const handleConfirm = (event: Event) => {
			cleanContainer()
			resolve(event.type) 
		}

		const handleCancel = (event: Event) => {
			cleanContainer()
			resolve(event.type) 
		}

		const template = html`
			<vaadin-confirm-dialog
				.header=${header}
				.message=${message}
				.confirmTheme=${confirmTheme}
				.cancelTheme=${"contrast"}
				.overlayClass=${overlayClass}
				.cancelButtonVisible=${cancelButton}
				.noCloseOnEsc=${closeOnEsc}
				@confirm=${handleConfirm}
				@cancel=${handleCancel}
				confirm-text=${confirmText}>
			</vaadin-confirm-dialog>
		`

		render(template, confirmDialogContainer)

		const confirmDialog = document.querySelector("vaadin-confirm-dialog")
		if (confirmDialog) {
			confirmDialog.opened = true
		}
	})
}
