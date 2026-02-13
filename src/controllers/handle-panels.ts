import router from "@router/router.ts"
import { Toast } from "@components/Toast.ts"
import type { TogglePanelsOptions } from "../types.ts"
import type { Context } from "@thepassle/app-tools/router.js"

/**
 * Toggles between two panels in a view by managing their `data-active` attributes and handles
 * router navigation when closing panels. Optionally waits for asynchronous operations to complete
 * before executing the toggle logic.
 * The function manages a two-panel system where:
 * - Panel 0 is typically the main/list view
 * - Panel 1 is typically the detail/secondary view
 * 
 * @param options The options object for the `togglePanels` function.
 * @description
 * **Toggle behavior based on panel states:**
 * - **Panel 0 active (data-active="true")**: Deactivates panel 0, activates panel 1, removes 
 *   "has-persistent-active" class from view
 * - **Panel 0 inactive (data-active="false")**: Navigates to the specified router path
 * - **Panel 1 already active**: Returns early without changes (prevents redundant toggling)
 * 
 * **Requirements:**
 * - Router context must contain a `reference` parameter (returns early if missing)
 * - View element must exist in the DOM
 * - At least one element with [data-active] attribute must exist
 * 
 * **Error handling:**
 * - Logs errors to console
 * - Navigates to fallback route on error
 * - Displays error message via Toast notification
 */
export async function togglePanels(options: TogglePanelsOptions) {
	const { viewSelector, routerNavigate, awaitFor } = options
	try {
		if (awaitFor) {
			if (Array.isArray(awaitFor)) {
				await Promise.all(awaitFor)
			} else {
				await awaitFor
			}
		}
		const reference = (router.context as Context).params.reference
		if (!reference) return
		const view = document.querySelector(viewSelector) as HTMLDivElement
		const panels = document.querySelectorAll("[data-active]") as NodeListOf<HTMLDivElement>
		if (!view) {
			throw new Error("View element not found.")
		}
		if (!panels.length) {
			throw new Error("No panels found with [data-active] attribute.")
		}
		if (panels[1]?.dataset.active === "true") return
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
		console.error(error)
		router.navigate(routerNavigate)
		Toast({ message: error.message })
	}
}

/**
 * Closes detail panels within a specified view by toggling their `data-active` attributes.
 * 
 * - Selects the view element using the provided selector.
 * - Finds all panels with a `data-active` attribute.
 * - If the view exists and there are at least two panels:
 *   - Sets the second panel's `data-active` to "false".
 *   - Sets the first panel's `data-active` to "true".
 *   - Adds the "has-persistent-active" class to the view element.
 *
 * @param viewSelector - A CSS selector string used to locate the view container element.
 */
export function closeDetailsPanels(viewSelector: string) {
	const view = document.querySelector(viewSelector) as HTMLDivElement
	const panels = document.querySelectorAll("[data-active]") as NodeListOf<HTMLDivElement>
	if (!view || panels.length === 0) return
	if (panels[1]) {
		panels[1].dataset.active = "false"
		panels[0].dataset.active = "true"
		view.classList.add("has-persistent-active")
	}
}
