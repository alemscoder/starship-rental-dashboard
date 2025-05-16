import { html, nothing } from "lit-html"
import { messagesStore } from "@store/gridData.store.ts"
import { SideNavBase } from "@base/side-nav/SideNavBase.ts"

export class SupportSideNav extends SideNavBase {

	static #instance: SupportSideNav

	constructor() {
		super("support")
		this.initialize()
		if (!!SupportSideNav.#instance) {
			return SupportSideNav.#instance
		}
		SupportSideNav.#instance = this
	}

	static getInstance() {
		if (!SupportSideNav.#instance) {
			new SupportSideNav()
		}
		return SupportSideNav.#instance
	}

	protected async initialize() {
		this.initializeCounter([
			{
				recordsStoreName: "messagesStore",
				recordsStore: messagesStore
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
			urlRoute: "/support/my-messages", 
			iconName: "message", 
			storageItemName: "favMessage", 
			recordsStore: messagesStore 
		})
	}

	protected pathAliasMap() {
		return {
			"my-messages": (reference: string) => [`/support/my-messages/${reference}`]
		}
	}

	protected template() {
		return html`
			<vaadin-side-nav 
				.onNavigate=${this.navigation}
				.location=${this.getPathName()} 
				id="messagesSideNav"
				has-children>
				<div slot="label">Messages</div>
				<vaadin-side-nav-item
					.pathAliases=${this.getPathAliases("my-messages")} 
					id="myMessages" 
					path="/support/my-messages">
					<vaadin-icon slot="prefix" src="/support.svg"></vaadin-icon>
					My Messages
					${this.renderCounterBadge("messagesStore")}
				</vaadin-side-nav-item>
			</vaadin-side-nav>
			<vaadin-side-nav id="issuesSideNav" has-children>
				<div slot="label">Issues</div>
				<vaadin-side-nav-item>
					<vaadin-icon slot="prefix" src="/open-issues.svg"></vaadin-icon>
					Unresolved
				</vaadin-side-nav-item>
				<vaadin-side-nav-item>
					<vaadin-icon slot="prefix" src="/closed-issues.svg"></vaadin-icon>
					Resolved
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
