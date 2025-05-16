import router from "@router/router.ts"
import { html, nothing } from "lit-html"
import { map } from "lit/directives/map.js"
import { Badge } from "@components/Badge.ts"
import { userDataStore } from "@store/userData.store.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import { getOrResetLocalStorage } from "@utils/get-or-reset-local-storage.ts"
import { unsubscribeStore, addUnsubscribe } from "@store/unsubscribe.store.ts"
import type { TemplateResult } from "lit-html"
import type { NavigateEvent } from "@vaadin/side-nav"
import type { Context } from "@thepassle/app-tools/router.js"
import type { CounterConfig, FavoriteSideNavItem } from "../../types.ts"

/**
 * The `SideNavBase` class provides a foundation for building a side 
 * navigation component. It includes methods for handling navigation, 
 * URL management, and rendering templates based on the current route context.
 * @abstract
 */
export abstract class SideNavBase {

	/**
	 * A map that keeps counters for different side navigation items, 
	 * where the key is a string identifier (e.g., the name of the nano store) 
	 * and the value is the corresponding count number for that nano store.
	 * @private
	 */
	#counters: Map<string, number | undefined> = new Map()

	/**
	 * A string that represents the identifier or name of 
	 * the side navigation in the url route.
	 * @private
	 */
	#sideNavName: string

	/**
	 * This property holds a `TemplateResult` containing the favorite navigation
	 * items or `undefined` if no favorites are available. It is used to maintain
	 * the rendered state of favorite items within the side navigation.
	 * @protected
	 */
	protected favoritesTemplate: TemplateResult | undefined

	/** 
	 * Creates an instance of the `SideNavBase` class.
	 * @constructor
	 * @param sideNavName The string name of the side 
	 * navigation in the url route.
	 */
	constructor(sideNavName: string) {
		this.#sideNavName = sideNavName
	}

	/**
	 * Provides a map of path aliases related to side navigation items.
	 * Define how different paths relate to specific side navigation items.
	 * @protected
	 * @abstract
	 * @returns A map of side nav items to URL alias generators.
	 */
	protected abstract pathAliasMap(): Record<string, (reference: string) => string[]>

	/**
	 * Returns the template to be rendered for the side navigation.
	 * @protected
	 * @abstract
	 * @returns The Lit-HTML template to render.
	 */
	protected abstract template(): TemplateResult

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to update the counter badge.
	 * @hook
	 * @protected
	 */
	protected updateCounterBadge(): void {}

	/**
	 * Handle the router integration in the vaadin-side-nav element.
	 * When a side nav item link is clicked, this function is called
	 * and the default click action is cancelled. This delegates the
	 * responsibility of navigation to the function's logic.
	 * @protected
	 * @param event - The navigation event that contains the 
	 * properties of the clicked side-nav item.
	 */
	protected navigation = ({ path }: NavigateEvent) => {
		const { pathname } = router.context.url
		if (path === pathname) {
			return
		}
		if (path) {
			router.navigate(path)
		}
	}

	/**
	 * Retrieves the reference parameter from the router's context.
	 * @protected
	 * @returns The string reference from the URL parameters.
	 */
	protected getUrlReference() {
		return (router.context as Context).params.reference
	}

	/**
	 * Returns the current URL pathname, which indicates 
	 * the user's current location within the application.
	 * @protected
	 * @returns The current URL pathname from the router's context.
	 */
	protected getPathName() {
		return router.context.url.pathname
	}

	/**
	 * Retrieves path aliases for a given side navigation item name.
	 * It generates URL aliases based on the current route's reference.
	 * @protected
	 * @param sideNavItemName - The string name of the side navigation item.
	 * @returns An array of string path aliases associated with the side navigation item.
	 */
	protected getPathAliases(sideNavItemName: string) {
		const urlReference = this.getUrlReference()
		const generateAliases = this.pathAliasMap()[sideNavItemName]
		return generateAliases ? generateAliases(urlReference) : []
	}

	/**
	 * Initializes and updates multiple counters based on nano store subscriptions.
	 * 
	 * Subscribes to one or multiple nano store and updates the count whenever the 
	 * store changes. If the store has already been subscribed to, it avoids
	 * redundant subscriptions by checking the `unsubscribeStore`.
	 * @protected
	 * @param counterConfigs A list of counter configurations and their associated nano stores.
	 */
	protected initializeCounter<T>(counterConfigs: CounterConfig<T>[]) {
		counterConfigs.forEach(counterConfig => {
			const { recordsStoreName, recordsStore } = counterConfig
			// Initialize counter with current store value
			this.#counters.set(recordsStoreName, recordsStore.get()?.length)
			// Set up subscription if not already subscribed
			if (!unsubscribeStore.get()[recordsStoreName]) {
				const unsubscribe = recordsStore.listen((items, oldItems) => {
					if (items && oldItems && items.length !== oldItems.length) {
						this.#counters.set(recordsStoreName, items.length)
						this.updateCounterBadge()
					}
				})
				addUnsubscribe(recordsStoreName, unsubscribe)
			}
		})
	}

	/**
	 * Renders a dynamic badge component displaying a counter value.
	 * 
	 * Displays the current count and automatically adjusts its visual style:
	 * - Standard styling when count > 0.
	 * - Dimmed styling when count === 0.
	 * - Renders nothing when count is undefined or null.
	 * @protected
	 * @param counterName - The string name of the counter to display. 
	 * It is usually the name of the nano store.
	 * @returns A lit-html TemplateResult when rendering a badge, or 
	 * `nothing` when no count is available
	 */
	protected renderCounterBadge(counterName: string) {
		const count = this.#counters.get(counterName)
		if (count || count === 0) {
			return Badge({
				text: count?.toString() || "0",
				theme: count ? "small contrast pill" : "small contrast pill dimmed",
				slot: "suffix"
			})
		} else {
			return nothing
		}
	}

	/**
	 * Builds a list of favorite side navigation items based on stored user preferences.
	 * 
	 * This method retrieves favorite item references from local storage and filters 
	 * the records stored in the provided nano store to generate navigation links.
	 * @template T - The type of objects stored in the nano store.
	 * @protected
	 * @param options - An object containing the configuration for the favorite navigation items.
	 * @returns A Lit-HTML template containing the favorite side navigation items, 
	 * or `undefined` if no matching records are found.
	 */
	protected buildFavoriteSideNavItem<T extends { [key: string]: any }>(options: FavoriteSideNavItem<T>) {
		const { iconName, recordsStore, storageItemName, urlRoute } = options
		const favorites = getOrResetLocalStorage(storageItemName, "number")
		const records = recordsStore.get()
		if (favorites && records && favorites.length !== 0 && records.length !== 0) {
			const filteredRecords = records.filter((record) => { 
				return favorites.includes(record.reference) 
			})
			return html`
				${map(filteredRecords, (record) => {
					let recordName: string | undefined
					const loggedInUserReference = userDataStore.get()?.reference
					if (urlRoute.includes("messages")) {
						const isSender = record.sender_reference === loggedInUserReference
						const contactInfo = isSender ? record.receiver : record.sender
						recordName = `${contactInfo?.first_name} ${contactInfo?.last_name}`
					} else if (urlRoute.includes("employees")) {
						recordName = `${record.first_name} ${record.last_name}`
					} else if (urlRoute.includes("locations")) {
						recordName = record.name.split(",")[0]
					}
					return html`
						<vaadin-side-nav-item path=${urlRoute}/${record.reference}>
							<vaadin-icon slot="prefix" src=/${iconName}.svg></vaadin-icon>
							${recordName}
						</vaadin-side-nav-item>
					`
				})}
			`
		}
	}

	/**
	 * Checks if there are any favorite items to display
	 * @protected
	 * @returns True if there are favorites, false otherwise
	 */
	protected hasFavorites() {
		return this.favoritesTemplate !== undefined
	}

	/**
	 * Observes the target DOM node and renders the side navigation
	 * content if the current URL `pathname` include the string
	 * provided in the param constructor.
	 * @public
	 */
	public render() {
		const pathname = this.getPathName()
		if (pathname.includes(this.#sideNavName)) {
			observeAndRender({ 
				template: this.template(),
				targetSelector: "vaadin-scroller#sideNavScroller",
				renderOptions: { host: this }
			})
		}
	}

}
