import { html, nothing, render } from "lit-html"
import { Dashboard } from "@components/Dashboard.ts"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { DrawerNavSection } from "@sections/DrawerNavSection.ts"
import { DrawerMenuSection } from "@sections/DrawerMenuSection.ts"
import { handleRefreshSession } from "@controllers/handle-refresh-session.ts"
import type { TemplateResult } from "lit-html"
import "@styles/app-layout.css"
import "@styles/global-side-nav.css"

/**
 * Handles the initialization and rendering of the main application layout.
 *
 * The `InitApp` class sets up the root layout structure of the web application,
 * including the navigation sidebar, the drawer menu, and session refresh logic.
 *
 * It follows the **singleton pattern** to ensure that only a single instance
 * exists throughout the application's lifetime. The instance is responsible for
 * rendering the layout into the `#outlet` container and determining when the
 * dashboard must be shown (i.e., when the current route is the root "/").
 */
export class InitApp {

	/** A private static property to hold the 
	 * singleton instance of `InitApp` 
	 * 
	 * @private
	 * @static
	*/
	static #instance: InitApp

	/**
	 * The container element where the app's content will be rendered.
	 * 
	 * @protected
	 */
	protected container: HTMLElement | DocumentFragment

	/**
	 * Creates a new instance of `InitApp` and immediately renders the layout.
	 *
	 * If an instance already exists, the constructor returns that same instance
	 * (enforcing the singleton pattern). Otherwise, it initializes the session
	 * refresh handler and stores the newly created instance.
	 * 
	 * @constructor
	 * @throws Throws an error if the container element is not found.
	 */
	constructor() {
		this.container = document.querySelector("#outlet") as HTMLElement
		if (!this.container) {
			throw new Error("Container not found")
		}
		this.render()
		// The `!!InitApp.#instance` condition checks whether 
		//	an instance of `InitApp` already exists...
		if (!!InitApp.#instance) {
			// if exist, immediately returns that existing instance...
			return InitApp.#instance
		}
		// Initialize refresh session only in new instance(s).
		this.initializeRefreshSession()
		// if no instance exists, create a new instance.
		InitApp.#instance = this
	}

	/** Initializes the session refresh handler responsible for maintaining
	 * the user's authentication state in the background.
	 * 
	 * @protected
	 */
	protected initializeRefreshSession() {
		handleRefreshSession()
	}

	/**
	 * Retrieves the navigation section template.
	 * 
	 * This asynchronous method loads the `DrawerNavSection`, which represents
	 * the application’s main navigation sidebar.
	 * 
	 * @protected
	 * @async
	 * @returns A lit-html template for the navigation section.
	 */
	protected async getNavSectionTemplate() {
		return DrawerNavSection()
	}

	/**
	 * Determines whether the current browser route corresponds to the root path (`"/"`).
	 * 
	 * @protected
	 * @returns Returns `true` if `location.pathname` equals `"/"`,
	 * otherwise returns `false`.
	 */
	protected isRootPathname() {
		return location.pathname === "/"
	}

	
	/**
	 * Builds the layout template of the application.
	 *
	 * The template includes:
	 * - The navigation section (`DrawerNavSection`)
	 * - The drawer menu (`DrawerMenuSection`) unless the user is on the root path
	 * - A `HeaderSection` containing a "Dashboard" title when rendering the root path
	 *
	 * @protected
	 * @param navSection - The navigation section template to render.
	 * @returns The resulting lit-html template for the layout.
	 *
	 * @remarks
	 * When on the root path:
	 * - Adds the `"dashboard"` CSS class to `<vaadin-app-layout>`
	 * - Renders the dashboard header instead of the drawer menu
	 */
	protected template(navSection: TemplateResult) {
		const isRootPathname = this.isRootPathname()
		return html`
			<vaadin-app-layout class=${isRootPathname ? "dashboard" : ""}>
				${navSection}
				${isRootPathname ? nothing : DrawerMenuSection()}
				<div class="View-container">
					${ isRootPathname ? HeaderSection({templateContent: html`<h1>Dashboard</h1>`}) : nothing }
				</div>
			</vaadin-app-layout>
		`
	}

	
	/**
	 * Renders the main application layout into the container.
	 *
	 * This method:
	 * 1. Checks if the current pathname is the root route.
	 * 2. Loads the navigation section template.
	 * 3. Renders the full application layout using lit-html.
	 * 4. If the user is at the root path, triggers the dashboard rendering.
	 *
	 * @protected
	 * @async
	 * @returns Resolves when the rendering is complete.
	 */
	protected async render() {
		const isRootPathname = this.isRootPathname()
		const navSection = await this.getNavSectionTemplate()
		render(this.template(navSection), this.container)
		if (isRootPathname) {
			Dashboard.getInstance().render()
		}
	}

}
