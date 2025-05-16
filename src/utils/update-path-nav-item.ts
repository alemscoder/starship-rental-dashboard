import router from "@router/router.ts"
import type { SideNavItem } from "@vaadin/side-nav/vaadin-side-nav-item"

/**
 * Updates the `path` attribute of specific navigation items within the side navigation
 * based on the current URL path, using a `MutationObserver` to detect changes to the DOM.
 *
 * - Observes changes in the DOM within a specified target element (`#outlet`).
 *   When elements are detected matching the defined pathnames, their `path`
 *   attributes are updated with the full URL path from `router.context.url.href`.
 * - Stops observing once the relevant navigation item is found and updated,
 *   to prevent unnecessary DOM observation.
 */
export function updatePathNavItem() {

	const targetNode = document.querySelector("#outlet") as HTMLDivElement
	const observerOptions = { childList: true, subtree: true }

	const callback: MutationCallback = (mutationsList, observer) => {
		if (router.context.url.pathname.includes("rentals")) {
			const rentals = document.querySelector<SideNavItem>("vaadin-side-nav-item#rentals")
			if (rentals) {
				rentals.path = router.context.url.href
				observer.disconnect()
			}
		} else if (router.context.url.pathname.includes("ships")) {
			const ships = document.querySelector<SideNavItem>("vaadin-side-nav-item#ships")
			if (ships) {
				ships.path = router.context.url.href
				observer.disconnect()
			}
		} else if (router.context.url.pathname.includes("support")) {
			const support = document.querySelector<SideNavItem>("vaadin-side-nav-item#support")
			if (support) {
				support.path = router.context.url.href
				observer.disconnect()
			}
		} else if (router.context.url.pathname.includes("settings")) {
			const settings = document.querySelector<SideNavItem>("vaadin-side-nav-item#settings")
			if (settings) {
				settings.path = router.context.url.href
				observer.disconnect()
			}
		}
	}

	const observer = new MutationObserver(callback)
	observer.observe(targetNode, observerOptions)

	/** Invoke the callback manually immediately after setting up 
	 * the observer to handle the case where the elements being 
	 * searched for are already present in the DOM at the start 
	 * of the observation, without waiting for a mutation to occur. */
	callback([], observer)

}
