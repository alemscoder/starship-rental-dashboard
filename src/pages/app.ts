import { html, render } from "lit-html"
import { DrawerNavSection } from "@sections/DrawerNavSection.ts"
import { DrawerMenuSection } from "@sections/DrawerMenuSection.ts"
import { handleRefreshSession } from "@controllers/handle-refresh-session.ts"
import type { TemplateResult } from "lit-html"
import "@styles/app-layout.css"
import "@styles/global-side-nav.css"

/**
 * Represents the initialization of the application layout.
 * The `InitApp` class is responsible for setting up the primary application layout,
 * including the navigation section and menu section and the refresh session handler. 
 * It follows the singleton pattern to ensure that only one instance of the class 
 * exists during the application runtime.
 */
export class InitApp {

	/** A private static property to hold the 
	 * singleton instance of `InitApp` 
	 * @private
	*/
	static #instance: InitApp

	/**
	 * The container element where the app's content will be rendered.
	 */
	container: HTMLElement | DocumentFragment

	/**
	 * Constructs an instance of `InitApp` and initializes 
	 * the application layout rendering.
	 * This constructor ensures that only one instance of `InitApp` 
	 * exists (singleton pattern).
	 * If an instance already exists, it returns the existing instance.
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

	/** Initializes the session refresh handler. */
	initializeRefreshSession() {
		handleRefreshSession()
	}

	/**
	 * Asynchronously retrieves the navigation section template.
	 * This method fetches the `DrawerNavSection` component which 
	 * is used to build the navigation section of the application.
	 * 
	 * @async
	 * @returns A lit-html template for the navigation section.
	 */
	async getNavSectionTemplate() {
		return DrawerNavSection()
	}

	/**
	 * Builds and returns the lit-html template 
	 * for the application layout.
	 * This template includes a navigation section, 
	 * a drawer menu, and a view container.
	 * 
	 * @param navSection - The navigation section template.
	 * @returns A lit-html template representing the application layout.
	 */
	template(navSection: TemplateResult) {
		return html`
			<vaadin-app-layout>
				${navSection}
				${DrawerMenuSection()}
				<div class="View-container"></div>
			</vaadin-app-layout>
		`
	}

	/**
	 * Renders the application layout into the container.
	 * This method retrieves the navigation 
	 * section asynchronously and renders the
	 * complete layout into the specified container 
	 * using the `lit-html` render function.
	 * 
	 * @async
	 */
	async render() {
		const navSection = await this.getNavSectionTemplate()
		render(this.template(navSection), this.container)
	}

}
