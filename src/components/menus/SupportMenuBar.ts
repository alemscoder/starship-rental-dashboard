import { html } from "lit-html"
import { createItem } from "@controllers/menu-bar.ts"
import type { MenuBarItem } from "@vaadin/menu-bar"

export function SupportMenuBar() {
	const items: MenuBarItem[] = [
		{
			component: createItem({ caption: "", iconPath: "/dots.svg" }),
			children: [
				{
					component: createItem({
						caption: "New menu item",
						iconPath: "/support.svg",
						iconClass: "small",
					}),
					className: "uncheckable",
				},
				{
					component: createItem({
						caption: "New menu item",
						iconPath: "/support.svg",
						iconClass: "small",
					}),
					className: "uncheckable",
				},
			],
		},
	]

	const template = html`
		<vaadin-menu-bar
			.items=${items}
			theme="small tertiary contrast icon"
			has-single-button
		>
		</vaadin-menu-bar>
	`

	return html` ${template} `
}
