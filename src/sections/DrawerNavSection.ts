import { html } from "lit-html"
import { Logo } from "@components/Logo.ts"
import { Search } from "@components/Search.ts"
import { MainSideNav } from "@components/MainSideNav.ts"
import { Notifications } from "@components/Notifications.ts"
import { UserMenuBar } from "@components/menus/UserMenuBar.ts"
import "@styles/drawer-nav-section.css"

export async function DrawerNavSection() {

	const template = html`
		<div slot="drawer" class="drawer-nav">
			${Logo()}
			${Search()}
			<vaadin-scroller class="flex-grow flex-shrink">
				${MainSideNav()}
			</vaadin-scroller>
			${Notifications()}
			<hr class="my-xs">
			${await UserMenuBar()}
		</div>
	`

	return html`
		${template}
	`

}
