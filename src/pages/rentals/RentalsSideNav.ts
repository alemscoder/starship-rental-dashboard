import { html, nothing } from "lit-html"
import { SideNavBase } from "@base/side-nav/SideNavBase.ts"
import { ticketsStore, customersStore, locationsStore } from "@store/gridData.store.ts"
import type { Tickets, Customers, Locations } from "../../types.ts"

export class RentalsSideNav extends SideNavBase {

	static #instance: RentalsSideNav

	constructor() {
		super("rentals")
		this.initialize()
		if (!!RentalsSideNav.#instance) {
			return RentalsSideNav.#instance
		}
		RentalsSideNav.#instance = this
	}

	static getInstance() {
		if (!RentalsSideNav.#instance) {
			new RentalsSideNav()
		}
		return RentalsSideNav.#instance
	}

	protected initialize() {
		this.initializeCounter<Tickets | Customers | Locations>([
			{
				recordsStoreName: "ticketsStore",
				recordsStore: ticketsStore
			},
			{
				recordsStoreName: "customersStore",
				recordsStore: customersStore
			},
			{
				recordsStoreName: "locationsStore",
				recordsStore: locationsStore
			}
		])
		this.initializeFavorites()
		this.render()
	}

	protected updateCounterBadge() {
		this.initialize()
	}

	public initializeFavorites() {
		this.favoritesTemplate = this.buildFavoriteSideNavItem({ 
			urlRoute: "/rentals/locations", 
			iconName: "location", 
			storageItemName: "favLocation", 
			recordsStore: locationsStore 
		})
	}

	protected pathAliasMap() {
		return {
			"tickets": (reference: string) => [`/rentals/tickets/${reference}`],
			"customers": (reference: string) => [`/rentals/customers/${reference}`],
			"locations": (reference: string) => [`/rentals/locations/${reference}`],
		}
	}

	protected template() { 
		return html`
			<vaadin-side-nav 
				.onNavigate=${this.navigation}
				.location=${this.getPathName()}
				id="rentalsSideNav"
				has-children>
				<vaadin-side-nav-item
					.pathAliases=${this.getPathAliases("tickets")} 
					id="tickets" 
					path="/rentals/tickets">
					<vaadin-icon slot="prefix" src="/ticket.svg"></vaadin-icon>
					Tickets
					${this.renderCounterBadge("ticketsStore")}
				</vaadin-side-nav-item>
				<vaadin-side-nav-item
					.pathAliases=${this.getPathAliases("customers")} 
					id="customers" 
					path="/rentals/customers">
					<vaadin-icon slot="prefix" src="/user.svg"></vaadin-icon>
					Customers
					${this.renderCounterBadge("customersStore")}
				</vaadin-side-nav-item>
				<vaadin-side-nav-item
					.pathAliases=${this.getPathAliases("invoices")} 
					id="invoices"
					path="/rentals/invoices">
					<vaadin-icon slot="prefix" src="/invoice.svg"></vaadin-icon>
					Invoices
					${this.renderCounterBadge("invoicesStore")}
				</vaadin-side-nav-item>
				<vaadin-side-nav-item
					.pathAliases=${this.getPathAliases("locations")}  
					id="locations"
					path="/rentals/locations">
					<vaadin-icon slot="prefix" src="/location.svg"></vaadin-icon>
					Locations
					${this.renderCounterBadge("locationsStore")}
				</vaadin-side-nav-item>
			</vaadin-side-nav>
			${this.hasFavorites() ? html`
				<vaadin-side-nav
					.onNavigate=${this.navigation}
					.location=${this.getPathName()}
					has-children>
					<div slot="label">Favorites</div>
					${this.favoritesTemplate}
				</vaadin-side-nav>
			` : nothing}
		`
	}

}
