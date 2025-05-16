import router from "@router/router.ts"
import { Toast } from "@components/Toast.ts"
import { debounce } from "@utils/debounce.ts"
import { browserClient } from "@lib/client.ts"
import { fetchData } from "@lib/utils.client.ts"
import { userDataStore } from "@store/userData.store.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import { handleLogoutAndRedirect } from "@controllers/handle-logout-and-redirect.ts"
import { addUnsubscribe, unsubscribeFrom, unsubscribeStore } from "@store/unsubscribe.store.ts"
import type { TemplateResult } from "lit-html"
import type { Popover } from "@vaadin/popover"
import type { Context } from "@thepassle/app-tools/router.js"
import type { GridColumn } from "@vaadin/grid/vaadin-grid-column.js"
import type { PreinitializedWritableAtom, PreinitializedMapStore } from "nanostores"
import type { CheckboxGroup, CheckboxGroupValueChangedEvent } from "@vaadin/checkbox-group"
import type { Grid, GridCellActivateEvent, GridCellPartNameGenerator, GridItemModel } from "@vaadin/grid"
import type { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload, RealtimePostgresDeletePayload, RealtimeChannel } from "@supabase/supabase-js"

/**
 * Abstract base class for grid components implementing Template Method pattern.
 * Provides core functionality for data fetching, real-time updates, navigation,
 * and rendering of grid-based views.
 * @template T - Type of the data objects displayed in the grid, extending a generic object 
 * with key-value pairs.
 * @abstract
 */
export abstract class GridBase<T extends { [key: string]: any }> {

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
	 * Stores the current search term used for filtering grid data.
	 * When a user enters a search query, this property holds the value that will be used
	 * to filter records based on the searchable fields defined in `getSearchableFields()`.
	 * @protected
	 */
	protected searchTerm: string = ''

	/**
	 * Stores the active filter selections grouped by category/field name.
	 * Each key represents a filter group (like 'status', 'role', etc.) and
	 * the value is an array of selected filter values for that group.
	 * @protected
	 */
	protected groupFilters: { [groupName: string]: string[] } = {}

	/**
	 * Tracks the total number of active filters across all filter groups.
	 * This count is used for UI indicators showing how many filters are currently applied.
	 * @protected
	 */
	protected activeFiltersCount: number | undefined

	/** 
	 * A `Set` object to track ongoing avatar images downloads.
	 * @protected
	 */
	protected downloadingAvatarImages = new Set<string>()

	/**
	 * The view ID of the DOM element where the grid will be rendered.
	 * @private
	 */
	#viewIdSelector: string

	/**
	 * Stores any error message that occurs during data fetching or initialization.
	 * @private
	 */
	#errorMsg: string | null = null

	/**
	 * A promise that resolves when the grid initialization is complete.
	 * @private
	 */
	#initializationPromise: Promise<void> | null = null

	/**
	 * Real-time channel instance used for subscribing to real-time database events.
	 * This is used to receive updates for data changes in the grid, such as inserts,
	 * updates, and deletions.
	 * @private
	 */
	#realtimeChannel: RealtimeChannel | null = null

	/**
	 * A function to unsubscribe from the real-time channel when no longer needed.
	 * It handles the disconnection and cleanup of the channel subscription.
	 * @private
	 */
	#removeRealtimeChannel: (() => void) | null = null

	/** 
	 * Creates an instance of the `GridBase` class.
	 * @constructor
	 * @param viewIdSelector The string selector where the grid will be rendered.
	 */
	constructor(viewIdSelector: string) {
		this.#viewIdSelector = viewIdSelector
	}

	/**
	 * Returns the name of the database table to fetch records from.
	 * 
	 * If the hook method `getDbQuery()` is not implemented to retrieve a specific
	 * query, the default query response will be set to `"*"`, fetching all columns.
	 * @protected
	 * @abstract
	 * @returns The string name of the database table.
	 * @example
	 * // Example of overriding in a subclass to specify a table name
	 * protected getDbTableName() {
	 *   return "users"
	 * }
	 */
	protected abstract getDbTableName(): string

	/**
	 * Retrieves the unique name for the real-time channel associated with the grid.
	 * 
	 * The channel name returned is used to subscribe and listen for real-time updates 
	 * specific to each grid instance. By providing a unique name, each grid can manage 
	 * its own channel independently, allowing precise control over the updates it receives.
	 * @protected
	 * @abstract
	 * @returns The name of the real-time channel for this grid instance.
	 */
	protected abstract getRealtimeChannelName(): string

	/**
	 * Returns the URL route that should be used for navigation related to the grid.
	 * @public
	 * @abstract
	 * @returns The string URL route for grid navigation.
	 */
	public abstract getGridUrlRoute(): string

	/**
	 * Returns the nano store for managing grid records.
	 * @protected
	 * @abstract
	 * @returns The records nano store.
	 */
	protected abstract getRecordsStore(): PreinitializedWritableAtom<T[] | null> | undefined

	/**
	 * Returns the template (UI layout) for rendering the grid.
	 * @protected
	 * @abstract
	 * @returns The Lit-HTML template to render.
	 */
	protected abstract template(): TemplateResult

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to define the specific query string required for a database operation.
	 * @hook
	 * @protected
	 * @returns The query string for database interaction.
	 * @example
	 * // Example of overriding in a subclass to fetch specific columns
	 * protected getDbQuery() {
	 *   return "id, name, status"
	 * }
	 */
	protected getDbQuery(): string | undefined {
		return undefined
	}

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to define the specific database equal filter criteria.
	 * @hook
	 * @protected
	 * @returns An object with the following structure, or `undefined`:
	 * - `column` (string): The name of the database column to filter.
	 * - `value` (any): The value to match in the specified column.
	 * @example
	 * // Example of overriding in a subclass to filter by "online"
	 * protected getDbEqFilter() {
	 *   return { column: "online", value: true }
	 * }
	 */
	protected getDbEqFilter(): { column: string, value: any } | undefined {
		return undefined
	}

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to define specific "OR" filter criteria for database queries.
	 * @hook
	 * @protected
	 * @returns An object with the following structure, or `undefined`:
	 * - `filters` (string): Defining the "OR" conditions to be applied.
	 * - `options` (Object, optional): An object containing additional options for the filter.
	 * - `referencedTable` (string, optional): Filter on referenced tables instead of the parent table.
	 * - `foreignTable` (string, optional): Deprecated, use `referencedTable` instead.
	 * @example
	 * // Example of overriding in a subclass to apply "OR" filters
	 * protected getDbOrFilter() {
	 *   return { 
	 *     filters: "status.eq.active, role.eq.admin",
	 *     options: { referencedTable: "users" } 
	 *   }
	 * }
	 */
	protected getDbOrFilter(): { 
		filters: string; 
		options?: { referencedTable?: string, foreignTable?: string } 
	} | undefined {
		return undefined
	}

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to specify the configuration for avatar images.
	 * @hook
	 * @protected
	 * @returns An object containing the avatar field name and 
	 * the associated nano store, or `undefined` if not configured.
	 * @example
	 * // Overriding the method in a subclass
	 * protected getAvatarConfig() {
	 *   return { 
	 *     avatarField: "profile_avatar",
	 *     avatarStore: profileAvatarStore 
	 *   }
	 * }
	 */
	protected getAvatarConfig(): { 
		avatarField: string,
		avatarStore: PreinitializedMapStore<Record<string, string | undefined>> 
	} | undefined {
		return undefined
	}

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to specify the configuration for hero images.
	 * @hook
	 * @protected
	 * @returns An object containing the hero field name and 
	 * the associated nano store, or `undefined` if not configured.
	 * @example
	 * // Overriding the method in a subclass
	 * protected getAvatarConfig() {
	 *   return { 
	 *     heroField: "profile_hero",
	 *     heroStore: profileHeroStore 
	 *   }
	 * }
	 */
	protected getHeroConfig(): { 
		heroField: string,
		heroStore: PreinitializedMapStore<Record<string, string | undefined>> 
	} | undefined {
		return undefined
	}

	/**
	 * This method provides a placeholder in the base class and can be overridden
	 * in subclasses to implement actions to do before update the `recordsStore` 
	 * with the `RealtimePostgresInsertPayload` and re-render the UI.
	 * @hook
	 * @protected
	 * @param payload - The payload containing the inserted record data.
	 * @returns A boolean value to indicate whether the insert should proceed `true`,
	 * or be halted `false` for avoid update the `recordsStore` and re-render the UI. 
	 * If nothing is returned, the insert proceeds by default.
	 */
	protected beforeRecordInserted(payload: RealtimePostgresInsertPayload<T>): boolean | void {}

	/**
	 * This method provides a placeholder in the base class and can be overridden 
	 * in subclasses to implement actions to do after update the `recordsStore` 
	 * with the `RealtimePostgresInsertPayload` and before re-render the UI.
	 * @hook
	 * @protected
	 * @param payload - The payload containing the inserted record data.
	 */
	protected afterRecordInserted(payload: RealtimePostgresInsertPayload<T>): void {}

	/**
	 * This method provides a placeholder in the base class and can be overridden 
	 * in subclasses to implement actions to do before update the `recordsStore` 
	 * with the `RealtimePostgresUpdatePayload` and re-render the UI.
	 * @hook
	 * @protected
	 * @param payload - The payload containing the inserted record data.
	 * @returns A boolean value to indicate whether the insert should proceed `true`,
	 * or be halted `false` for avoid update the `recordsStore` and re-render the UI. 
	 * If nothing is returned, the insert proceeds by default.
	 */
	protected beforeRecordUpdated(payload: RealtimePostgresUpdatePayload<T>): boolean | void {}

	/**
	 * This method provides a placeholder in the base class and can be overridden
	 * in subclasses to implement actions to do after update the `recordsStore` 
	 * with the `RealtimePostgresUpdatePayload` and before re-render the UI.
	 * @hook
	 * @protected
	 * @param payload - The payload containing the updated record data.
	 */
	protected afterRecordUpdated(payload: RealtimePostgresUpdatePayload<T>): void {}

	/**
	 * This method provides a placeholder in the base class and can be overridden
	 * in subclasses to define the implementation of updating the user store data
	 * with the `RealtimePostgresUpdatePayload`.
	 * @hook
	 * @protected
	 * @param payload - The payload containing the updated record data.
	 */
	protected updateUserStoreData(payload: RealtimePostgresUpdatePayload<T>): void {}

	/**
	 * Returns an array of field names from the item that should be included in search operations.
	 * This method provides a placeholder in the base class and can be overridden in subclasses
	 * to specify which fields should be searchable for a given item type.
	 * @hook
	 * @protected
	 * @param item - The item from which to get searchable fields
	 * @returns An array of field names to be searched, or `undefined` if not configured.
	 */
	protected getSearchableFields(item: T): string[] | undefined {
		return undefined
	}

	/**
	 * Fetches data from the database and sets it in the record nano store.
	 * Handles any errors that occur during data fetching.
	 * @protected
	 * @returns Promise that resolves when data has been successfully fetched and set.
	 */
	protected async fetchAndSetData() {
		const recordsStore = this.getRecordsStore()
		const { tableData, errorMsg } = await fetchData<T>({
			tableName: this.getDbTableName(), 
			query: this.getDbQuery(),
			eq: this.getDbEqFilter(),
			or: this.getDbOrFilter()
		})
		if (tableData && recordsStore) {
			recordsStore.set(tableData)
		}
		this.#errorMsg = errorMsg
	}

	/**
	 * Initializes grid component by loading data (if needed) and rendering UI.
	 * 
	 * Key behaviors:
	 * - Only fetches data if store is empty (optimization)
	 * - Delegates data loading to `getGridDataAndRender()` when needed
	 * - Ensures render occurs after data load or immediately if data exists
	 * - Idempotent (safe for multiple calls)
	 * @protected
	 * @returns Resolves when initialization completes
	 */
	protected async initializeGrid() {
		const recordsStore = this.getRecordsStore()
		if (recordsStore && recordsStore.get()?.length === 0) {
			await this.getGridDataAndRender()
		} else {
			this.render()
			return
		}
	}

	/**
	 * Handles the data loading and rendering sequence for the grid.
	 * 
	 * Internal workflow:
	 * 1. Sets up initialization promise tracking
	 * 2. Fetches data via `fetchAndSetData()`
	 * 3. Waits for data to load
	 * 4. Triggers UI render
	 * @public
	 * @returns Resolves when data is loaded and rendered
	 */
	public async getGridDataAndRender() {
		this.#initializationPromise = this.fetchAndSetData()
		await this.#initializationPromise
		this.render()
	}

	/**
	 * Waits for the grid initialization to complete.
	 * Can be called externally to ensure the grid is fully 
	 * initialized before performing further actions.
	 * @public
	 * @returns Promise that resolves when the grid is initialized.
	 */
	public async waitForInitialization() {
		if (this.#initializationPromise) {
			return this.#initializationPromise
		}
		return Promise.resolve()
	}

	/**
	 * Sets up a real-time channel for receiving database event notifications.
	 * Subscribes to `INSERT`, `UPDATE`, and `DELETE` events on the specified table,
	 * enabling automatic updates in the grid based on data changes. This method also
	 * registers an unsubscribe function for later cleanup to avoid memory leaks.
	 * @protected
	 */
	protected setupRealtimeChannel() {
		this.#realtimeChannel = this.subscribeRealtimeChannel()
		this.#removeRealtimeChannel = () => {
			if (this.#realtimeChannel) {
				this.supabase.removeChannel(this.#realtimeChannel)
				this.#realtimeChannel = null
			}
		}
		addUnsubscribe(this.getRealtimeChannelName(), () => {
			if (this.#removeRealtimeChannel) {
				this.#removeRealtimeChannel()
			}
		})
	}

	/**
	 * Connect the real-time channel subscription if it is not already active.
	 * 
	 * This method checks the `unsubscribeStore` to determine if the real-time channel 
	 * subscription returned by `getRealtimeChannelName()` exists. If it does not, it 
	 * initializes the real-time channel by calling `setupRealtimeChannel()` to ensure 
	 * that the grid component continues to receive real-time database updates.
	 * @protected
	 */
	protected connectRealtimeChannel() {
		if (!unsubscribeStore.get()[this.getRealtimeChannelName()]) {
			this.setupRealtimeChannel()
		}
	}

	/**
	 * Gets the `vaadin-grid` element from the DOM.
	 * @protected
	 * @returns The `vaadin-grid` element.
	 */
	protected getGridElement(): Grid<T> | null {
		return document.querySelector(`${this.#viewIdSelector} > vaadin-grid`)
	}

	/**
	 * Gets the currently active item in the grid.
	 * @public
	 * @returns The active grid item, `null` or `undefined`.
	 */
	public getGridActiveItem() {
		const grid = this.getGridElement()
		if (grid) return grid.activeItem
	}

	/**
	 * Sets the active item in the grid.
	 * @public
	 * @param gridItem - The item to set as active.
	 */
	public setGridActiveItem(gridItem: T | null | undefined) {
		const grid = this.getGridElement()
		if (grid) grid.activeItem = gridItem
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
	 * Updates the image field in the given store based on changes in the provided payloads.
	 * 
	 * If the field value has changed, the stored image reference is cleared. If the field 
	 * is set to `null`, the corresponding image entry is removed from the store.
	 * @protected
	 * @param fieldName - The name of the image field being updated.
	 * @param store - The nano store managing image records.
	 * @param newPayload - The updated record containing the new image field value.
	 * @param oldPayload - The previous record state before the update.
	 */
	protected handleImageFieldUpdate(
		fieldName: string, 
		store: PreinitializedMapStore<Record<string, string | undefined>>, 
		newPayload: T, 
		oldPayload: Partial<T>
	) {
		// Overwrite: If newPayload[fieldName] is not equal to oldPayload[fieldName], 
		//	and newPayload[fieldName] is different of null, and oldPayload[fieldName] is
		//	different of null, and newPayload.id is in the store
		if (
			newPayload[fieldName] !== oldPayload[fieldName] &&
			newPayload[fieldName] !== null &&
			oldPayload[fieldName] !== null &&
			(newPayload.id in store.get())
		) {
			/** The Id of the new record*/
			const recordId = newPayload.id
			// Deletes the key that matches the Id of the new record
			store.setKey(recordId, undefined)
			console.log(`${fieldName.toUpperCase()} OVERWRITE`)
		}
		// If the fieldName in the new record is null
		//	and newPayload.id is in the store
		if (
			newPayload[fieldName] === null &&
			(newPayload.id in store.get())
		) {
			/** The Id of the modified record*/
			const recordId = oldPayload.id as string
			// Deletes the key that matches the Id of the modified record
			store.setKey(recordId, undefined)
			console.log(`${fieldName.toUpperCase()} DELETED`)
		}
	}

	/**
	 * Handle the `INSERT` event dispatched by the table.
	 * @protected
	 * @param payload - The payload containing the inserted record data.
	 */
	protected handleRecordInserted = (payload: RealtimePostgresInsertPayload<T>) => {
		if (this.beforeRecordInserted(payload) === false) {
			return
		}
		const recordsStore = this.getRecordsStore()
		console.log("Change INSERT received!", payload)
		if (payload.new && recordsStore) {
			/** The new record inserted in the table */
			const newRecord = payload.new
			/** Get the actual state in the store */
			const prevRecords = recordsStore.get()
			// If `prevRecords` exist...
			const result = prevRecords
			// Create a new array using the spread operator(...)
			//	and add `newRecord` at the end of the array
			? [...prevRecords, newRecord]
			//  If `prevRecords` don't exist,
			//	create a new array with the `newRecord`
			: [newRecord]
			// Update the state in the store with the result
			recordsStore.set(result)
		}
		this.afterRecordInserted(payload)
		this.render()
	}

	/**
	 * Handle the `UPDATE` event dispatched by the table.
	 * @protected
	 * @param payload - The payload containing the updated record data.
	 */
	protected handleRecordUpdated = (payload: RealtimePostgresUpdatePayload<T>) => {
		if (this.beforeRecordUpdated(payload) === false) {
			return
		}
		const recordsStore = this.getRecordsStore()
		const avatarConfig = this.getAvatarConfig()
		const heroConfig = this.getHeroConfig()
		console.log("Change UPDATE received!", payload)
		if (payload.new  && recordsStore) {
			/** Get the actual state in the store */
			const prevRecords = recordsStore.get()
			// If `prevRecords` don't exist, return null
			if (!prevRecords) return null
			// If `prevRecords` exist, maps the records
			const result = prevRecords.map((record) =>
				// If the record with the same id as the previous 
				//	record `payload.old.id` match...
				record.id === payload.old.id
				// Combine old record data with new data
				? { ...record, ...payload.new } 
				// If the id does not match, return the record without changes
				: record
			)
			// Update the state in the store with the result
			recordsStore.set(result)
			// handle avatar image if provided
			if (avatarConfig) {
				const { avatarField, avatarStore } = avatarConfig
				this.handleImageFieldUpdate(
					avatarField, 
					avatarStore, 
					payload.new, 
					payload.old
				)
			}
			// handle avatar image if provided
			if (heroConfig) {
				const { heroField, heroStore } = heroConfig
				this.handleImageFieldUpdate(
					heroField, 
					heroStore, 
					payload.new, 
					payload.old
				)
			}
		}
		this.afterRecordUpdated(payload)
		this.updateUserStoreData(payload)
		this.render()
	}

	/**
	 * Handle the `DELETE` event dispatched by the table.
	 * @protected
	 * @param payload - The payload containing the deleted record data.
	 */
	protected handleRecordDeleted = (payload: RealtimePostgresDeletePayload<T>) => {
		const recordsStore = this.getRecordsStore()
		const avatarConfig = this.getAvatarConfig()
		const heroConfig = this.getHeroConfig()
		console.log("Change DELETE received!", payload)
		if (payload.old && recordsStore) {
			/** Get the actual state in the store */
			const prevRecords = recordsStore.get()
			// If `prevRecords` exist...
			const result = prevRecords
			// Filters records to delete the record with the same 
			//	`record.id` as the deleted record `payload.old.id`
			? prevRecords.filter((record) => record.id !== payload.old.id)
			// If `prevRecords` don't exist, return a empty array
			: []
			// Update the state in the store with the result
			recordsStore.set(result)
			/** The record Id of the deleted record*/
			const recordId = payload.old.id as string
			if (avatarConfig) {
				const { avatarStore } = avatarConfig
				if (avatarStore && avatarStore.get()[recordId]) {
					// Deletes the key that matches the Id of the deleted record
					avatarStore.setKey(recordId, undefined)
				}
			}
			if (heroConfig) {
				const { heroStore } = heroConfig
				if (heroStore && heroStore.get()[recordId]) {
					// Deletes the key that matches the Id of the deleted record
					heroStore.setKey(recordId, undefined)
				}
			}
		}
		this.render()
	}

	/**
	 * Supabase channel subscription for real-time events.
	 * @protected
	 */
	protected subscribeRealtimeChannel() {
		return this.supabase.channel(this.getRealtimeChannelName())
		.on(
			"postgres_changes", 
			{ event: "INSERT", schema: "public", table: this.getDbTableName() }, 
			this.handleRecordInserted
		)
		.on(
			"postgres_changes", 
			{ event: "UPDATE", schema: "public", table: this.getDbTableName() }, 
			this.handleRecordUpdated
		)
		.on(
			"postgres_changes", 
			{ event: "DELETE", schema: "public", table: this.getDbTableName() }, 
			this.handleRecordDeleted
		)
		.subscribe((status, error) => {
			//console.log('subscribe_status, ' + status)
			//console.log(error)
			if (error) {
				console.log("Subscription failed:", error.message)
			} else if (status === "SUBSCRIBED") {
				console.log(`Successful "${this.getRealtimeChannelName()}" SUBSCRIBED!`)
			} else if (status === "CLOSED") {
				console.log(`"${this.getRealtimeChannelName()}" CLOSED`)
			} else if (status === "TIMED_OUT") {
				console.log(`"${this.getRealtimeChannelName()}" TIMED_OUT`)
			} else if (status === "CHANNEL_ERROR") {
				console.log(`"${this.getRealtimeChannelName()}" CHANNEL_ERROR`)
			}
		})
		.on(
			// @ts-ignore
			"system", 
			{}, 
			async (payload: any) => {
				console.log("system", payload)
				// Scenario: When the browser tab is in the background and a `system` payload is received,
				// the access token may have expired. This happens because token refresh operations
				// cannot occur while the tab is inactive, causing the channel to close (status `CLOSED`).
				// Resolution:
				// 1. Unsubscribe from the current Realtime channel to handle the expired token scenario.
				// 2. Attempt to refresh the authentication session. If the session refresh fails:
				//    - Perform a logout and redirect the user to the login page.
				//    - Display an error message in a toast notification.
				// 3. If the session refresh succeeds:
				//    - Reinitialize the grid to ensure that any missed changes during the inactive state are fetched.
				//    - Reconnect the Realtime channel to resume operations.
				if (payload.message.includes("Access token has expired")) {
					console.log("The Realtime System has detected that the access token has expired.")
					unsubscribeFrom(this.getRealtimeChannelName())
					const { error } = await this.supabase.auth.refreshSession()
					if (error) {
						await handleLogoutAndRedirect()
						Toast({ 
							message: `Error refreshing session. \n${error.message}`, 
							duration: -1 
						})
						return
					}
					this.initializeGrid()
					this.connectRealtimeChannel()
				}
				if (payload.status === "error") {
					Toast({ message: "Realtime system down!" })
				}
			}
		)
	}

	/**
	 * Navigates to a new route and sets the active grid item based on the URL.
	 * @protected
	 * @param path - The string URL path to navigate to.
	 */
	protected navigateAndSetActiveItem(path?: string) {
		const recordsStore = this.getRecordsStore()
		/** Save the `reference` value */
		const urlReference = this.getUrlReference()
		if (router.context.url.href === path) {
			return
		}
		// Navigate to the route path
		if (path) router.navigate(path)
		if (recordsStore) {
			/** Get the employees data from the state */
			const data = recordsStore.get()
			/** Find the employee whose `reference` matches with the `urlReference` */
			const item = data?.find((record: T) => record.reference.toString() === urlReference)
			// Update the `activeItem` property in the grid
			this.setGridActiveItem(item)
		}
	}

	/**
	 * Handles anchor link navigation within the grid.
	 * Prevents the default anchor behavior and uses custom navigation logic.
	 * @protected
	 * @param event - The mouse event triggered by clicking an anchor.
	 */
	protected handleAnchorNavigation(event: MouseEvent) {
		/** The `<a>` current element clicked*/
		const anchor = event.currentTarget as HTMLAnchorElement
		/** The `path` value in the `anchor` element */
		const path = anchor.href
		event.preventDefault()
		this.navigateAndSetActiveItem(path)
	}

	/**
	 * Handles the activation of a grid cell.
	 * Navigates to a new route based on the activated 
	 * item’s reference or return to the grid url route.
	 * @protected
	 * @param event - The event triggered when a grid cell is activated.
	 */
	protected handleCellActivate(event: GridCellActivateEvent<T>) {
		const item = event.detail.model.item
		if (item) {
			const reference = item.reference.toString()
			const urlReference = this.getUrlReference()
			if (reference === urlReference) {
				router.navigate(this.getGridUrlRoute())
				return
			}
			router.navigate(`${this.getGridUrlRoute()}/${reference}`)
		}
	}

	/** 
	 * Listen for the event `@activate-item` and 
	 * update the `activeItem` in the grid.
	 * @protected
	 */
	protected handleActivateItem() {
		this.navigateAndSetActiveItem()
	}

	/** 
	 * Listen for the event `@deactivate-item` and 
	 * update the `activeItem` prop in the grid.
	 * @protected
	 */
	protected handleDeactivateItem() {
		this.setGridActiveItem(null)
	}

	/**
	 * Updates the items displayed in the grid based on current filters and search terms.
	 * This method applies both the group filters and search term filtering to the original data,
	 * and updates the grid to display only the matching items.
	 * @protected
	 */
	protected updateGridItems() {
		const originalItems = this.getRecordsStore()?.get() || []
		let filteredData = originalItems
		const hasActiveFilters = Object.values(this.groupFilters).some(filters => filters.length > 0)
		if (hasActiveFilters) {
			filteredData = originalItems.filter(item => {
				return Object.entries(this.groupFilters).some(([groupName, filters]) => {
					if (filters.length === 0) return false
					const itemValue = item[groupName]?.toString()
					return filters.some(filter => itemValue === filter)
				})
			})
		}
		let searchedData = filteredData
		if (this.searchTerm) {
			searchedData = filteredData.filter(item => {
				return this.getSearchableFields(item)?.some(fieldValue => {
					return String(fieldValue).toLowerCase().includes(this.searchTerm.toLowerCase())
				})
			})
		}
		const grid = this.getGridElement()
		if (grid) {
			grid.items = searchedData
		}
	}

	/**
	 * Handles search input with debounce to prevent excessive filtering operations.
	 * Updates the searchTerm property and refreshes the grid view with the filtered results.
	 * @protected
	 * @param searchTerm - The search query text entered by the user.
	 */
	protected handleSearch = debounce((searchTerm: string) => {
		this.searchTerm = searchTerm
		this.updateGridItems()
	}, 300)

	/**
	 * Calculates the total number of active filters across all filter groups.
	 * This is used to update the activeFiltersCount property for UI indicators.
	 * @protected
	 * @param groupFilters - The object containing all filter groups and their selected values.
	 * @returns The total count of all selected filter values across groups.
	 */
	protected sumLengthGroupFilters(groupFilters: { [groupName: string]: string[] }) {
		let sum = 0
		for (const prop in groupFilters) {
			if (Array.isArray(groupFilters[prop])) {
				sum += groupFilters[prop].length
			}
		}
		return sum
	}

	/**
	 * Handles changes to filter checkbox group selections.
	 * Updates the groupFilters object with the new selected values and refreshes the grid.
	 * @protected
	 * @param event - The value changed event from the checkbox group component.
	 */
	protected handleFilterValueChanged(event: CheckboxGroupValueChangedEvent) {
		const { value } = event.detail
		const groupName = (event.currentTarget as CheckboxGroup).dataset.group
		if (!groupName) return
		this.groupFilters[groupName] = value
		this.activeFiltersCount = this.sumLengthGroupFilters(this.groupFilters)
		this.updateGridItems()
	}

	/**
	 * Clears all active filters and resets the grid to show all items.
	 * Resets all checkbox groups to empty selection and updates the grid view.
	 * @protected
	 * @param event - The mouse event from the clear filters button.
	 */
	protected clearFilters = (event: MouseEvent) => {
		const target = event.currentTarget as HTMLDivElement
		const checkboxGroupContainer = target.closest("#checkboxGroupContainer")
		this.groupFilters = {}
		if (checkboxGroupContainer) {
			const checkboxGroups = checkboxGroupContainer.querySelectorAll<CheckboxGroup>("vaadin-checkbox-group")
			checkboxGroups.forEach(group => {
				group.value = []
			})
		}
		this.updateGridItems()
		this.closePopover()
	}

	/**
	 * Closes the filter popover component.
	 * Called after applying filters or when the user dismisses the filter interface.
	 * @protected
	 */
	protected closePopover = () => {
		const popover = document.querySelector<Popover>("#searchBar > vaadin-popover")
		if (popover) popover.opened = false
	}

	/** 
	 * Generates CSS `part` names for the grid cells 
	 * and add a special class for the active item.
	 * @protected
	 * @param column - The grid column.
	 * @param model - The grid item model.
	 * @returns The string part name 
	 */
	protected generatePart: GridCellPartNameGenerator<T> = (
		column: GridColumn, 
		model: GridItemModel<T>
	) => {
		const urlReference = this.getUrlReference()
		let partName = "nav-item"
		if (model.item.reference.toString() === urlReference) {
			partName += " active-nav-item"
		}
		return partName
	}

	/**
	 * Renders the grid UI by applying the template to the DOM.
	 * If an error occurred during data fetching, it displays an error message instead.
	 * @protected
	 */
	protected render() {
		if (this.#errorMsg) {
			return Toast({ message: this.#errorMsg, duration: -1 })
		} else {
			observeAndRender({ 
				template: this.template(),
				targetSelector: this.#viewIdSelector,
				renderOptions: { host: this }
			})
		}
	}

}
