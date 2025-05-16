import { addUnsubscribe } from "@store/unsubscribe.store.ts"
import type { Checkbox, CheckboxIndeterminateChangedEvent } from "@vaadin/checkbox"

/**
 * Observes changes in the DOM to synchronize the state of two checkbox elements.
 * Specifically, it observes the `#outlet` node for any changes and, if both
 * the grid selection checkbox and the search checkbox are detected, it listens
 * for the `indeterminate-changed` event on the grid checkbox and updates the
 * indeterminate state of the search checkbox accordingly.
 *
 * - Uses a MutationObserver to detect when the checkboxes become available in the DOM.
 * - Stores a cleanup function to disconnect the observer and remove event listeners when
 *   needed.
 * - Immediately invokes the callback after setting up the observer to ensure
 *   initial states are synchronized without waiting for mutations.
 */
export function updateIndeterminateCheckbox() {

	const targetNode = document.querySelector("#outlet") as HTMLDivElement
	const observerOptions = { childList: true, subtree: true }

	/** Declare a variable to hold the cleanup function */
	let cleanup: (() => void) | null = null

	const callback: MutationCallback = (mutationsList, observer) => {
		const gridCheckbox = document.querySelector(".vaadin-grid-select-all-checkbox") as Checkbox
		const searchCheckbox = document.querySelector(".employees-view header vaadin-checkbox") as Checkbox
		if (gridCheckbox && searchCheckbox) {
			const listener = (event: CheckboxIndeterminateChangedEvent) => {
				console.log(event)
				searchCheckbox.indeterminate = event.detail.value
			}
			gridCheckbox.addEventListener("indeterminate-changed", listener)
			// Store the cleanup function
			cleanup = () => {
				gridCheckbox.removeEventListener("indeterminate-changed", listener)
				observer.disconnect()
			}
			observer.disconnect()
		}
	}

	const observer = new MutationObserver(callback)
	observer.observe(targetNode, observerOptions)

	/** Invoke the callback manually immediately after setting up 
	 * the observer to handle the case where the elements being 
	 * searched for are already present in the DOM at the start 
	 * of the observation, without waiting for a mutation to occur. */
	callback([], observer)

	// Add to the `unsubscribeStore` the `cleanup` function
	addUnsubscribe("updateIndeterminateCheckbox", () => {
		if (cleanup) {
			cleanup()
		}
	})

}
