import { html } from "lit-html"
import router from "@router/router.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import type { NavigateEvent } from "@vaadin/side-nav"

export function MainSideNav() {

	const navigation = ({ path }: NavigateEvent) => {
		const { href } = router.context.url
		if (path === href) {
			return
		}
		if (path) {
			router.navigate(path)
		}
	}

	const rentalsPathAliases = [
		"/rentals/tickets",
		"/rentals/customers", 
		"/rentals/invoices",
		"/rentals/locations",
	]
	const shipsPathAliases = [
		"/ships/starships"
	] 
	const supportPathAliases = [
		"/support/my-messages"
	] 
	const settingsPathAliases = [
		"/settings/employees"
	]

	const template = () => html`
		<vaadin-side-nav
			.onNavigate=${navigation}
			.location=${router.context.url.pathname}
			id="mainSideNav"
			class="stacked">
			<vaadin-side-nav-item
				.pathAliases=${rentalsPathAliases}
				id="rentals" 
				path="/rentals/tickets">
				<vaadin-icon src="/world.svg" slot="prefix"></vaadin-icon>
				<span>Rentals</span>
			</vaadin-side-nav-item>
			<vaadin-side-nav-item
				.pathAliases=${shipsPathAliases} 
				id="ships" 
				path="/ships/starships">
				<vaadin-icon src="/rocket.svg" slot="prefix"></vaadin-icon>
				<span>Ships</span>
			</vaadin-side-nav-item>
			<vaadin-side-nav-item
				.pathAliases=${supportPathAliases} 
				id="support" 
				path="/support/my-messages">
				<vaadin-icon src="/support.svg" slot="prefix"></vaadin-icon>
				<span>Support</span>
			</vaadin-side-nav-item>
			<vaadin-side-nav-item
				.pathAliases=${settingsPathAliases}
				id="settings" 
				path="/settings/employees">
				<vaadin-icon src="/settings.svg" slot="prefix"></vaadin-icon>
				<span>Settings</span>
			</vaadin-side-nav-item>
		</vaadin-side-nav>
	`

	const render = () => {
		observeAndRender({
			template: template(),
			targetSelector: ".drawer-nav > vaadin-scroller",
		})
	}
	render()

}
