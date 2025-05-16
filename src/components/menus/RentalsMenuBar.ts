import { html } from "lit-html"
import { createItem } from "@controllers/menu-bar.ts"
import type { MenuBarItem, MenuBarItemSelectedEvent } from "@vaadin/menu-bar"

export function RentalsMenuBar() {
	const items: MenuBarItem[] = [
		{
			component: createItem({ caption: "", iconPath: "/plus.svg" }),
			children: [
				{
					component: createItem({
						caption: "New Ticket",
						iconPath: "/ticket.svg",
						iconClass: "small",
					}),
					className: "uncheckable ticket",
				},
				{
					component: createItem({
						caption: "New Customer",
						iconPath: "/user-plus.svg",
						iconClass: "small",
					}),
					className: "uncheckable customer",
				},
				{
					component: createItem({
						caption: "New Invoice",
						iconPath: "/invoice.svg",
						iconClass: "small",
					}),
					className: "uncheckable invoice",
				},
				{
					component: createItem({
						caption: "New Location",
						iconPath: "/location.svg",
						iconClass: "small",
					}),
					className: "uncheckable location",
				},
			],
		},
	]

	const openNewCustomerDialog = async () => {
		const { NewCustomerDialog } = await import("@components/dialogs/NewCustomerDialog.ts")
		const newCustomerDialog = new NewCustomerDialog()
		newCustomerDialog.open()
	}

	const openNewLocationDialog = async () => {
		const { NewLocationDialog } = await import("@components/dialogs/NewLocationDialog.ts")
		const newLocationDialog = new NewLocationDialog()
		newLocationDialog.open()
	}

	const itemSelected = (event: MenuBarItemSelectedEvent) => {
		const item = event.detail.value
		if (item.className?.includes("customer")) {
			openNewCustomerDialog()
		}
		if (item.className?.includes("location")) {
			openNewLocationDialog()
		}
	}

	const template = html`
		<vaadin-menu-bar
			@item-selected=${itemSelected}
			.items=${items}
			id="rentalsMenuBar"
			theme="small tertiary contrast icon"
			has-single-button
		>
		</vaadin-menu-bar>
	`

	return html` ${template} `
}
