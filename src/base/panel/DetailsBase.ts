import { html } from "lit-html"
import router from "@router/router.ts"
import { Toast } from "@components/Toast.ts"
import { browserClient } from "@lib/client.ts"
import { userDataStore } from "@store/userData.store.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import { getOrResetLocalStorage } from "@utils/get-or-reset-local-storage.ts"
import type { TemplateResult } from "lit-html"
import type { PreinitializedWritableAtom } from "nanostores"
import type { Context } from "@thepassle/app-tools/router.js"
import "@styles/details-panels.css"

/**
 * The `DetailsBase` class provides a foundation for displaying and interacting 
 * with detailed views of data records. It includes methods for fetching data 
 * based on URL references, rendering templates for headers, bodies, and footers, 
 * and interacting with a record store.
 * 
 * @template T - The type of data this class handles, extending a generic object 
 * with key-value pairs.
 * @abstract
 */
export abstract class DetailsBase<T extends { [key: string]: any }> {

	/**
	 * Supabase client instance for database operations and real-time subscriptions.
	 * @protected
	 */
	protected supabase = browserClient()

	/**
	 * Stores the data of the currently logged-in user, retrieved from the user data store.
	 * @protected
	 */
	protected loggedInUserData = userDataStore.get()

	/** 
	 * A `Set` object to track ongoing avatar images downloads.
	 * @protected
	 */
	protected downloadingAvatarImages = new Set<string>()

	/** 
	 * A `Set` object to track ongoing hero images downloads.
	 * @protected
	 */
	protected downloadingHeroImages = new Set<string>()

	/**
	 * Holds the data that represents the details of the item being displayed.
	 * @protected
	 */
	protected data: T | undefined

	/**
	 * A private selector for the CSS class used to identify the view where 
	 * the detailed content will be rendered.
	 * @private
	 */
	#viewClassSelector: string

	/**
	 * Creates an instance of the `DetailsBase` class.
	 * @constructor
	 * @param viewClassSelector - The CSS selector that targets the 
	 * container where the detailed view will be rendered.
	 */
	constructor(viewClassSelector: string) {
		this.#viewClassSelector = viewClassSelector
	}

	/**
	 * Retrieves the nano store containing records for this details view.
	 * @protected
	 * @abstract
	 * @returns - The records nano store.
	 */
	protected abstract getRecordsStore(): PreinitializedWritableAtom<T[] | null> | undefined

	/**
	 * Closes the details view and clears the currently active item.
	 * @protected
	 * @abstract
	 */
	protected abstract closeDetails(): void

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to update the details view with new data.
	 * @hook
	 * @public
	 * @param details - The updated details to be rendered.
	 */
	public updateDetails(details: T): void {}

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to define the specific header section of the details view.
	 * @hook
	 * @protected
	 * @returns The Lit-HTML rendered header template.
	 */
	protected headerTemplate(): TemplateResult | symbol | undefined {
		return undefined
	}

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to define the specific body section of the details view.
	 * @hook
	 * @protected
	 * @returns The Lit-HTML rendered body template.
	 */
	protected bodyTemplate(): TemplateResult | symbol | undefined {
		return undefined
	}

	/**
	 This method provides a placeholder in the base class and can be overridden in
	 * subclasses to define the specific footer section of the details view.
	 * @hook
	 * @protected
	 * @returns The Lit-HTML rendered footer template.
	 */
	protected footerTemplate(): TemplateResult | symbol | undefined {
		return undefined
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
	 * Retrieves the data associated with the reference found in the URL.
	 * If no matching data is found, it shows a toast notification and throws an error.
	 * @public
	 * @throws {Error} - If no item is found with the URL reference.
	 * @returns - The data item matching the reference.
	 */
	public getDataByReference() {
		const reference = this.getUrlReference()
		const recordsStore = this.getRecordsStore()
		if (reference && recordsStore) {
			const item = recordsStore.get()?.find(
				(item) => item.reference.toString() === reference
			)
			if (item) return item
		}
		Toast({
			message: `Item not found with reference: ${reference}`
		})
		throw new Error(`Item not found with reference: ${reference}`)
	}

	/**
	 * Adds or removes the current record from the list of favorites stored in localStorage.
	 * If the record is already in the favorites list, it is removed; otherwise, it is added.
	 * @protected
	 * @param storageItemName - The key under which the favorite records are stored in localStorage.
	 */
	protected toggleFavorites(storageItemName: string) {
		const favorites = getOrResetLocalStorage(storageItemName, "number")
		const recordReference = this.data?.reference
		if (favorites && recordReference) {
			const index = favorites.indexOf(recordReference)
			if (index !== -1) {
				favorites.splice(index, 1)
			} else {
				favorites.push(recordReference)
			}
			localStorage.setItem(storageItemName, JSON.stringify(favorites))
			this.render()
		}
	}

	/**
	 * Checks if the current record is marked as a favorite in localStorage.
	 * @protected
	 * @param storageItemName - The key under which the favorite records are stored in localStorage.
	 * @returns Returns `true` if the record is in the favorites list, otherwise `false`.
	 */
	protected isFavorite(storageItemName: string) {
		const recordReference = this.data?.reference
		if (!recordReference) return false
		const item = localStorage.getItem(storageItemName)
		if (item) {
			try {
				const favRecord = JSON.parse(item)
				if (Array.isArray(favRecord)) {
					return favRecord.includes(recordReference)
				} else {
					console.warn("The value in localStorage is not an array.")
					localStorage.setItem(storageItemName, JSON.stringify([]))
					return false
				}
			} catch (error) {
				console.error("Error parsing favRecord:", error)
				localStorage.setItem(storageItemName, JSON.stringify([]))
				return false
			}
		}
		return false
	}

	/**
	 * Creates and returns the Lit-HTML template that structures the details view,
	 * including the header, body, and footer sections.
	 * @protected
	 * @protected
	 * @returns - The rendered template for the details view.
	 */
	protected template() {
		return html`
			<div 
				class="Panels-panel" 
				data-active="false" 
				data-persistent="false" 
				data-placeholder="false" 
				data-overlay="true">
				<div class="Panels-panel-wrapper">
					<div class="View">
						${this.headerTemplate()}
						${this.bodyTemplate()}
						${this.footerTemplate()}
					</div>
				</div>
			</div>
		`
	}

	/**
	 * Observes the target DOM element and renders the details view's template into it.
	 */
	protected render() {
		observeAndRender({ 
			template: this.template(),
			targetSelector: this.#viewClassSelector,
			renderOptions: { host: this }
		})
	}

}
