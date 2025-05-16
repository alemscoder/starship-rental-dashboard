import router from "@router/router.ts"
import { html, nothing } from "lit-html"
import { ShipsMenuBar } from "@components/menus/ShipsMenuBar.ts"
import { RentalsMenuBar } from "@components/menus/RentalsMenuBar.ts"
import { SupportMenuBar } from "@components/menus/SupportMenuBar.ts"
import { SettingsMenuBar } from "@components/menus/SettingsMenuBar.ts"
import "@styles/drawer-menu-section.css"

interface Routes {
	[key: string]: string
}

export function DrawerMenuSection() {

	/** Render header title */
	const { pathname } = router.context.url
	const routes: Routes = {
		rentals: "Rentals",
		ships: "Ships",
		support: "Support",
		settings: "Settings"
	}
	const headerTitle = Object.keys(routes).find(key => pathname.includes(key))

	const loadMenuBar = () => {
		switch (headerTitle) {
			case "rentals":
				return RentalsMenuBar()
			case "ships":
				return ShipsMenuBar()
			case "support":
				return SupportMenuBar()
			case "settings":
				return SettingsMenuBar()
			default:
				break
		}
	}

	const template = html`
		<div class="drawer-menu" slot="drawer">
			<nav>
				<h2 class="text-l h-s flex items-center ps-s pe-xs py-s m-0 flex items-center justify-between">
					${headerTitle ? routes[headerTitle] : nothing}
					${loadMenuBar()}
				</h2>
				<vaadin-scroller
					theme="overflow-indicators" 
					id="sideNavScroller" 
					scroll-direction="vertical"
					class="View-content">
				</vaadin-scroller>
			</nav>
		</div>
	`

	return html`
		${template}
	`

}
