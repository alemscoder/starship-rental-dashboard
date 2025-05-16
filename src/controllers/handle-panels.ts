import router from "@router/router.ts"
import { Toast } from "@components/Toast.ts"
import type { TogglePanelsOptions } from "../types.ts"

/**
 * Toggles the active state of panels, dispatch 'activate-item' 
 * event and navigates to a different route.
 * @param options The options object for the `togglePanels` function.
 */
export async function togglePanels(options: TogglePanelsOptions) {

	/** Destructure options object */
	const { viewSelector, routerNavigate, awaitFor } = options
	try {
		// If there are promises to wait for, wait for them
		if (awaitFor) {
			if (Array.isArray(awaitFor)) {
				await Promise.all(awaitFor)
			} else {
				await awaitFor
			}
		}
		/** Get a reference of the view */
		const view = document.querySelector(viewSelector) as HTMLDivElement
		/** Get all panels with `[data-active]` attribute */
		const panels = document.querySelectorAll("[data-active]") as NodeListOf<HTMLDivElement>
		// Handle query elements errors
		if (!view) {
			throw new Error("View element not found.")
		}
		if (!panels.length) {
			throw new Error("No panels found with [data-active] attribute.")
		}
		/** Get a reference of the grid and dispatch the 'activate-item' event */
		const grid = document.querySelector("vaadin-grid")
		const event = new Event("activate-item")
		if (grid) grid.dispatchEvent(event)
		/** Return here if details panel come with 'data-active=true' by default */
		if (panels[1]?.dataset.active === "true") return
		/** Switch case for the active status and selected view class */
		switch (panels[0].dataset.active) {
			case "true":
				panels[0].dataset.active = "false"
				panels[1]?.dataset && (panels[1].dataset.active = "true")
				view?.classList.remove("has-persistent-active")
				break
			case "false":
				router.navigate(routerNavigate)
				break
			default:
				break
		}
	} catch (error: any) {
		// Show error message and navigate back
		console.error(error)
		router.navigate(routerNavigate)
		Toast({ message: error.message })
	}
}

/**
 * Close the details panel, dispatch 'deactivate-item' 
 * event and restore class to the selected view.
 * @param viewSelector A CSS selector to select the view element.
 */
export function closeDetailsPanels(viewSelector: string) {
	/** Get a reference of the view */
	const view = document.querySelector(viewSelector) as HTMLDivElement
	/** Get all panels with `[data-active]` attribute */
	const panels = document.querySelectorAll("[data-active]") as NodeListOf<HTMLDivElement>
	/** Get a reference of the grid and dispatch the 'deactivate-item' event */
	const grid = document.querySelector("vaadin-grid")
	const event = new Event("deactivate-item")
	if (grid) grid.dispatchEvent(event)
		/** Toggle the active status and restore selected view class */
	if (panels[1]) {
		panels[1].dataset.active = "false"
		panels[0].dataset.active = "true"
		view?.classList.add("has-persistent-active")
	}
}
