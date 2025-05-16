import { html } from "lit-html"
import { spread } from "@open-wc/lit-helpers"
import { ifDefined } from "lit-html/directives/if-defined.js"
import type { BadgeOptions } from "../types.ts"
import "@styles/badge.css"

/**
 * Displays a badge status.
 * @param options An object containing options to configure the Badge.
 */
export function Badge(options: Partial<BadgeOptions>) {

	const { text, theme = "badge", className, slot, ...restAttrs } = options
	const fullTheme = theme.includes("badge") ? theme : `badge ${theme}`

	const template = html`
		<span 
			theme=${fullTheme}
			class=${ifDefined(className)}
			slot=${ifDefined(slot)}
			${spread(restAttrs)}
		>${text}</span>
	`

	return html`
		${template}
	`
}
