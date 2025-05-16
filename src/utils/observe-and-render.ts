import { render } from "lit-html"
import type { RenderOptions } from "lit-html"
import type { ObserveAndRenderOptions } from "../types.ts"

/**
 * Observes the DOM and renders the provided template when the target element is found.
 * Supports dynamic `renderBefore` node search using a selector when the reference is undefined.
 * @param options The options object for the `observeAndRender` function.
 */
export function observeAndRender(options: ObserveAndRenderOptions) {
	/** Destructure options object */
	const { template, targetSelector, renderOptions } = options

	const targetNode = document.querySelector("#outlet") as HTMLDivElement
	const observerOptions = { childList: true, subtree: true }

	const callback: MutationCallback = (mutationsList, observer) => {
		const container = document.querySelector(targetSelector) as HTMLElement | DocumentFragment

		if (container) {
			/** Create a copy of `renderOptions` to avoid mutating the original */
			const finalRenderOptions: RenderOptions = { ...renderOptions }

			// If `renderBefore` was provided but is undefined, and we have a selector,
			// try to find the node using the selector
			if (
				renderOptions?.renderBefore === undefined &&
				"renderBefore" in (renderOptions || {}) &&
				renderOptions?.renderBeforeSelector
			) {
				const renderBeforeNode = container.querySelector(
					renderOptions.renderBeforeSelector,
				) as ChildNode | null

				if (renderBeforeNode) {
					finalRenderOptions.renderBefore = renderBeforeNode
				}
			}

			// Remove the selector from the final options as it's not 
			// part of the standard `renderOptions`
			if ("renderBeforeSelector" in finalRenderOptions) {
				delete (finalRenderOptions).renderBeforeSelector
			}

			render(template, container, finalRenderOptions)
			observer.disconnect()
		}
	}

	const observer = new MutationObserver(callback)
	observer.observe(targetNode, observerOptions)

	/** Invoke the callback manually immediately after setting up
	 * the observer to handle the case where the container being
	 * searched for are already present in the DOM at the start
	 * of the observation, without waiting for a mutation to occur. */
	callback([], observer)
}
