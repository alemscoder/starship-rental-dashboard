import { html, nothing } from "lit-html"
import { employeesStore } from "@store/gridData.store.ts"
import { SideNavBase } from "@base/side-nav/SideNavBase.ts"

/**
 * The `SettingsSideNav` class is a concrete implementation of the
 * `SideNavBase` abstract class, providing a side navigation for
 * settings-related routes.
 * It follows the singleton pattern to ensure that only one instance 
 * of the class exists during the application runtime.
 * @extends {SideNavBase}
 */
export class SettingsSideNav extends SideNavBase {

	/** 
	 * A private static property to hold the singleton instance.
	 * @static
	 * @private
	 */
	static #instance: SettingsSideNav

	/**
	 * Constructs an instance of `SettingsSideNav` and 
	 * call the `initialize` method.
	 * If an instance already exists, it returns the existing 
	 * instance (singleton pattern), ensuring only one instance of
	 * the class is active at a time.
	 * @constructor
	 */
	constructor() {
		super("settings")
		this.initialize()
		if (!!SettingsSideNav.#instance) {
			return SettingsSideNav.#instance
		}
		SettingsSideNav.#instance = this
	}

	/**
	 * Retrieves the singleton instance of the `SettingsSideNav` class.
	 * If the instance does not exist, it creates a new one.
	 * This method ensures that only one instance of `SettingsSideNav` is used 
	 * throughout the application, maintaining a consistent state and preventing 
	 * multiple instances from interfering with each other.
	 * @static
	 */
	static getInstance() {
		if (!SettingsSideNav.#instance) {
			new SettingsSideNav()
		}
		return SettingsSideNav.#instance
	}

	/**
	 * Initialize the side navigation by setting up counters, 
	 * favorites, and rendering.
	 * Subscribes to the employeesStore to track employee count 
	 * and initializes favorite items in the side navigation.
	 * @protected
	 */
	protected initialize() {
		this.initializeCounter([
			{
				recordsStoreName: "employeesStore",
				recordsStore: employeesStore
			}
		])
		this.initializeFavorites()
		this.render()
	}

	/**
	 * Updates the counter badge in the side navigation by 
	 * re-initializing the counters. This method is typically 
	 * called when the underlying data changes and the UI needs
	 * to reflect those changes.
	 * @protected
	 */
	protected updateCounterBadge() {
		this.initialize()
	}

	/**
	 * Initializes the favorites section of the side navigation.
	 * Creates a template for the favorite employees item.
	 * @public
	 */
	public initializeFavorites() {
		this.favoritesTemplate = this.buildFavoriteSideNavItem({ 
			urlRoute: "/settings/employees", 
			iconName: "user", 
			storageItemName: "favEmployee", 
			recordsStore: employeesStore 
		})
	}

	protected pathAliasMap() {
		return {
			"employees": (reference: string) => [`/settings/employees/${reference}`]
		}
	}

	protected template() {
		return html`
			<vaadin-side-nav 
				.onNavigate=${this.navigation}
				.location=${this.getPathName()} 
				id="settingsSideNav" 
				has-children>
				<vaadin-side-nav-item
					.pathAliases=${this.getPathAliases("employees")} 
					id="employees" 
					path="/settings/employees">
					<vaadin-icon slot="prefix" src="/user.svg"></vaadin-icon>
					Employees
					${this.renderCounterBadge("employeesStore")}
				</vaadin-side-nav-item>
				<vaadin-side-nav-item id="teams">
					<vaadin-icon slot="prefix" src="/users.svg"></vaadin-icon>
					Teams
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
