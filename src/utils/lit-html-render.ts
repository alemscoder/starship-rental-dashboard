import { render } from "lit-html"
import type { ObserveAndRenderOptions } from "../types.ts"

/**
 * Renders the provided template if the target element is available.
 * @param options The options object for the `litHtmlRender` function.
 */
export function litHtmlRender(options: ObserveAndRenderOptions) {

	/** Destructure options object */
	const { template, targetSelector } = options

	const container = document.querySelector(targetSelector) as HTMLElement

	if (container) {
		render(template, container)
	}

}
