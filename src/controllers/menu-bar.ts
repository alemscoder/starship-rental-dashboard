import { html, render } from "lit-html"
import { Badge } from "@components/Badge.ts"
import { processStatusBadge } from "@utils/utils.ts"
import { ifDefined } from "lit-html/directives/if-defined.js"
import type { CreateItemOptions, CreateItemAvatarOptions } from "../types.ts"

/**
 * Creates a menu bar item with an optional icon.
 *
 * @param options An object containing options to configure the menu bar item.
 * @returns A `vaadin-menu-bar-item` element containing the 
 * specified caption and, if provided, an icon.
 *
 * @example
 * // Creates a menu item with a caption and an icon
 * const item = createItemIcon({
 *   caption: "Settings",
 *   iconPath: "/icons/settings.svg",
 *   iconClass: "settings-icon"
 * })
 *
 */
export function createItem(options: CreateItemOptions) {
	const { caption, iconPath, iconClass } = options
	const item = document.createElement("vaadin-menu-bar-item")
	const icon = document.createElement('vaadin-icon')
	if (iconPath) {
		icon.setAttribute('src', iconPath)
		item.appendChild(icon)
	}
	if (iconClass) {
		icon.setAttribute("class", iconClass)
	}
	item.appendChild(document.createTextNode(caption))
	return item
}

/**
 * Creates a menu bar item with an avatar, name, and status badge,
 * designed for displaying user information.
 *
 * @param options An object containing options to configure the
 * menu bar item with an avatar and user details.
 * @returns A `vaadin-menu-bar-item` element containing an 
 * avatar, name, and status badge.
 *
 * @example
 * // Creates a menu item with an avatar and status badge
 * const item = createItemAvatar({
 *   name: "Jane Doe",
 *   initials: "JD",
 *   status: "Online",
 *   img: "/avatars/jane_doe.jpg"
 * })
 *
 */
export function createItemAvatar(options: CreateItemAvatarOptions) {
	const { name, initials, status, img } = options
	const { statusText, themeBadge } = processStatusBadge(status)
	const item = document.createElement("vaadin-menu-bar-item")
	const content = html`
	<div class="flex gap-s items-center">
		<vaadin-avatar 
			name=${name} 
			abbr=${initials} 
			img=${ifDefined(img)}>
		</vaadin-avatar>
		<div class="flex flex-col items-start gap-xs">
			<div class="font-bold text-body text-s">
				${name}
			</div>
			${Badge({ 
				text: statusText, 
				theme: themeBadge
			})}
		</div>
	</div>`
	render(content, item)
	return item
}

/**
 * Creates a base menu bar item with an avatar, tooltip, and status badge.
 *
 * @param options An object containing options to configure the
 * menu bar item with an avatar and status.
 * @returns A `vaadin-menu-bar-item` element containing an avatar  
 * with a tooltip and a badge indicating user status.
 *
 * @example
 * // Create an avatar base item with a tooltip and status badge
 * const item = createItemAvatarBase({
 *   name: "John Smith",
 *   initials: "JS",
 *   status: "Online",
 *   img: "/avatars/john_smith.jpg"
 * })
 *
 */
export function createItemAvatarBase(options: CreateItemAvatarOptions) {
	const { name, initials, status, img } = options
	const { themeBadge } = processStatusBadge(status)
	const item = document.createElement("vaadin-menu-bar-item")
	const content = html`
	<vaadin-avatar
		theme="small" 
		name=${name} 
		abbr=${initials} 
		img=${ifDefined(img)}>
		<vaadin-tooltip 
			text=${name}
			slot="tooltip"
			position="start">
		</vaadin-tooltip>
	</vaadin-avatar>
	${Badge({ 
		theme: themeBadge,
		className: "absolute bottom-xs end-xs status-badge"
	})}
	`
	render(content, item)
	return item
}
