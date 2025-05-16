import { html } from "lit-html"
import { starshipsStore } from "@store/gridData.store.ts"
import { SideNavBase } from "@base/side-nav/SideNavBase.ts"

export class ShipsSideNav extends SideNavBase {

	static #instance: ShipsSideNav

	constructor() {
		super("ships")
		this.initialize()
		if (!!ShipsSideNav.#instance) {
			return ShipsSideNav.#instance
		}
		ShipsSideNav.#instance = this
	}

	static getInstance() {
		if (!ShipsSideNav.#instance) {
			new ShipsSideNav()
		}
		return ShipsSideNav.#instance
	}

	protected async initialize() {
		this.initializeCounter([
			{
				recordsStoreName: "starshipsStore",
				recordsStore: starshipsStore
			}
		])
		this.render()
	}

	protected updateCounterBadge() {
		this.initialize()
	}

	protected pathAliasMap() {
		return {
			"starships": (reference: string) => [`/ships/starships/${reference}`]
		}
	}

	protected template() {
		return html`
			<vaadin-side-nav
				.onNavigate=${this.navigation}
				.location=${this.getPathName()} 
				id="shipsSideNav" 
				has-children>
				<vaadin-side-nav-item
					.pathAliases=${this.getPathAliases("starships")}  
					id="starships" 
					path="/ships/starships">
					<vaadin-icon slot="prefix" src="/rocket.svg"></vaadin-icon>
					Starships
					${this.renderCounterBadge("starshipsStore")}
				</vaadin-side-nav-item>
				<vaadin-side-nav-item>
					<vaadin-icon slot="prefix" src="/gps.svg"></vaadin-icon>
					GPS Map
				</vaadin-side-nav-item>
				<vaadin-side-nav-item>
					<vaadin-icon slot="prefix" src="/reports.svg"></vaadin-icon>
					Reports
				</vaadin-side-nav-item>
			</vaadin-side-nav>
		`
	}

}
