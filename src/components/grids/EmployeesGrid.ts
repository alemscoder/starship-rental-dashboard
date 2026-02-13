import { html } from "lit-html"
import { Badge } from "@components/Badge.ts"
import { GridBase } from "@base/grid/GridBase.ts"
import { downloadFile } from "@lib/utils.client.ts"
import { SearchBar } from "@components/SearchBar.ts"
import { userDataStore } from "@store/userData.store.ts"
import { columnBodyRenderer } from "@vaadin/grid/lit.js"
import { employeesStore } from "@store/gridData.store.ts"
import { processStatusBadge, convertDateTime } from "@utils/utils.ts"
import { EmployeeDetails } from "@components/panels/EmployeeDetails.ts"
import { profileAvatarStore, profileHeroStore } from "@store/fileUrl.store.ts"
import type { Employee } from "../../types.ts"
import type { GridColumnBodyLitRenderer } from "@vaadin/grid/lit.js"
import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js"
import type { CheckboxGroupValueChangedEvent } from "@vaadin/checkbox-group"
import type { GridSelectionColumn } from "@vaadin/grid/vaadin-grid-selection-column"
import "@github/relative-time-element"
import "@styles/employees-grid.css"

/**
 * This class represents a grid of employees, extending the functionality 
 * of the generic `GridBase` class. It handles fetching, displaying, and managing 
 * employee records, including avatars and status updates.
 * It follows the singleton pattern to ensure that only one instance 
 * of the class exists during the application runtime.
 * @extends GridBase<Employee>
 */
export class EmployeesGrid extends GridBase<Employee> {

	/** 
	 * A private static property to hold the singleton instance.
	 * @static
	 * @private
	 */
	static #instance: EmployeesGrid

	/**
	 * Reference to the SearchBar component instance used for 
	 * handling search and filter functionality.
	 * When initialized, this provides the UI for searching, 
	 * filtering, and selecting employees.
	 * @protected
	 */
	protected searchBarInstance: SearchBar | null = null

	/**
	 * Constructs a singleton instance of the EmployeesGrid component.
	 * 
	 * Initialization Sequence:
	 * 1. Sets up the parent grid component with the target DOM selector
	 * 2. Configures the search bar functionality
	 * 3. Initializes grid data (fetches if empty)
	 * 4. Connects to realtime updates channel
	 * 5. Enforces singleton pattern by:
	 *    - Returning existing instance if available
	 *    - Storing new instance in static #instance property
	 * 
	 * Key Behaviors:
	 * - Implements singleton pattern to maintain single source of truth
	 * - Performs all necessary initialization in single call
	 * - Maintains idempotency when called multiple times
	 * @constructor
	 * @throws {Error} If DOM selector is invalid or Supabase connection fails
	 */
	constructor() {
		super("#employeesView")
		this.setupSearchBar()
		this.initializeGridBase()
		this.connectRealtimeChannel()
		if (!!EmployeesGrid.#instance) {
			return EmployeesGrid.#instance
		}
		EmployeesGrid.#instance = this
	}

	/**
	 * Returns the singleton instance of EmployeesGrid, creating it if necessary.
	 * @static
	 * @returns The single instance of the EmployeesGrid.
	 */
	static getInstance() {
		if (!EmployeesGrid.#instance) {
			new EmployeesGrid()
		}
		return EmployeesGrid.#instance
	}

	protected getRecordsStore() {
		return employeesStore
	}

	protected getAvatarConfig() {
		return { 
			avatarField: "profile_avatar", 
			avatarStore: profileAvatarStore 
		}
	}

	protected getHeroConfig() {
		return { 
			heroField: "profile_hero", 
			heroStore: profileHeroStore 
		}
	}

	protected getDbTableName() {
		return "employees"
	}

	protected getRealtimeChannelName() {
		return "RealtimeChannelEmployees"
	}

	public getGridUrlRoute() {
		return "/settings/employees"
	}

	protected getSearchableFields(employee: Employee) {
		return [employee.first_name, employee.last_name, employee.job_title]
	}

	protected afterRecordUpdated(payload: RealtimePostgresUpdatePayload<Employee>) {
		const urlReference = this.getUrlReference()
		const employeeReference =  payload.new.reference.toString()
		if (urlReference === employeeReference) {
			EmployeeDetails.getInstance().updateDetails(payload.new)
		}
	}

	protected updateUserStoreData(payload: RealtimePostgresUpdatePayload<Employee>) {
		const employeeId = payload.new.id
		const userId = this.loggedInUserData?.id
		if (employeeId === userId) {
			userDataStore.set(payload.new)
		}
	}

	/**
	 * Initializes and configures the search bar component for the employees grid.
	 * Sets up search functionality, checkbox for selection, filter button, and
	 * registers event handlers for search, select all, and filter operations.
	 * @protected
	 */
	protected setupSearchBar() {
		this.searchBarInstance = new SearchBar({ 
			selector: ".employees-view header",
			checkbox: true,
			filterButton: true,
			onSearch: (searchTerm) => this.handleSearch(searchTerm),
			onSelectAll: (checked) => this.handleSelectAll(checked),
			popoverTemplate: () => this.popoverTemplate()
		})
	}

	/**
	 * Handles the "select all" functionality for the grid.
	 * When triggered from the search bar's checkbox, this method either selects
	 * or deselects all employees in the grid via the grid's selection column.
	 * @protected
	 * @param checked - Boolean indicating whether all items should be 
	 * selected (true) or deselected (false).
	 */
	protected handleSelectAll(checked: boolean) {
		const gridSelectionColumn = document.querySelector(
			"vaadin-grid > vaadin-grid-selection-column"
		) as GridSelectionColumn
		if (checked) {
			gridSelectionColumn.selectAll = true
		} else {
			gridSelectionColumn.selectAll = false
		}
	}

	/**
	 * Extends the parent class's filter handling with additional 
	 * functionality for updating the UI.
	 * After filters are applied, this updates the search bar to 
	 * show the correct count of active filters.
	 * @protected
	 * @param event - The checkbox group value changed event 
	 * containing the new filter selections
	 */
	protected handleFilterValueChanged = (event: CheckboxGroupValueChangedEvent) => {
		super.handleFilterValueChanged(event)
		if (this.searchBarInstance) {
			this.searchBarInstance.updateOptions({ filterCounter: this.activeFiltersCount })
		}
	}

	/**
	 * Downloads an employee's avatar image from the storage if it hasn't been downloaded already.
	 * @protected
	 * @param employeeId - The ID of the employee whose avatar is being downloaded.
	 * @param path - The path of the avatar in the storage.
	 * @returns A promise that resolves once the image has been downloaded and stored.
	 */
	protected async downloadEmployeeAvatar(employeeId: string, path: string) {
		await downloadFile({
			bucket: "avatars",
			id: employeeId,
			filePath: path,
			downloadingSet: this.downloadingAvatarImages,
			onSuccess: (id, fileUrl) => {
				profileAvatarStore.set({ ...profileAvatarStore.get(), [id]: fileUrl })
				this.render()
			}
		})
	}

	/**
	 * Generates the HTML template for the filter popover content.
	 * Creates a popover with filter options organized by groups,
	 * including checkboxes for selection and a clear filters button.
	 * @protected
	 * @returns A lit-html template for the filter popover content.
	 */
	protected popoverTemplate = () => {
		return html`
			<div class="p-s">
				<div class="flex items-center justify-between">
					<h3 class="text-l text-header font-medium">
						Filters
					</h3>
					<vaadin-button
						@click=${this.closePopover} 
						theme="icon small tertiary contrast">
						<vaadin-icon src="/close.svg"></vaadin-icon>
					</vaadin-button>
				</div>
				<div id="checkboxGroupContainer" class="flex flex-col">
					<vaadin-checkbox-group
						@value-changed=${this.handleFilterValueChanged} 
						label="Role"
						theme="vertical"
						data-group="role">
						<vaadin-checkbox value="admin" label="Admin"></vaadin-checkbox>
						<vaadin-checkbox value="manager" label="Manager"></vaadin-checkbox>
						<vaadin-checkbox value="staff" label="Staff"></vaadin-checkbox>
					</vaadin-checkbox-group>
					<vaadin-button 
						@click=${this.clearFilters} 
						theme="outline" 
						class="text-body mt-m">
						Clear Filters
					</vaadin-button>
				</div>
			</div>
		`
	}

	/**
	 * Renders the employee information, including the employee's avatar and name.
	 * @protected
	 * @param employee - The employee record being rendered.
	 * @returns The Lit-HTML template to render.
	 */
	protected employeeInfoRenderer: GridColumnBodyLitRenderer<Employee> = (employee) => {
		/** The abbreviation composed from `first_name` first letter
		 * and `last_name` first letter */
		const abbr = `${employee.first_name[0]}${employee.last_name[0]}`
		/** The current id(s) and url(s) in the store */
		const currentAvatarStore = profileAvatarStore.get()
		/** The avatar url from the `[employee.id]` in the store */
		const employeeAvatarUrl = currentAvatarStore[employee.id]
		// If `employee.profile_avatar` field have value, and `avatarUrl` is
		//	not defined in the store, call the `downloadEmployeeAvatar()`
		if (employee.profile_avatar && (employeeAvatarUrl === undefined)) {
			this.downloadEmployeeAvatar(employee.id, employee.profile_avatar)
		}
		return html`
			<div class="Object name-column">
				<vaadin-avatar
					.img=${employeeAvatarUrl || ""}
					class="prefix center"
					name=${employee.first_name} ${employee.last_name} 
					abbr=${abbr}>
				</vaadin-avatar>
				<a 
					class="title text-m font-bold text-body"
					@click=${this.handleAnchorNavigation}
					href="/settings/employees/${employee.reference}">
					${employee.first_name} ${employee.last_name} 
				</a>
				<div>
					<div class="text-s text-body">
						${employee.job_title}
					</div>
					<div class="text-s text-secondary">
						${employee.email}
					</div>
				</div>
			</div>
		`
	}

	/**
	 * Renders the employee's status, including a badge with 
	 * their status and the date they joined.
	 * @protected
	 * @param employee - The employee record being rendered.
	 * @returns The Lit-HTML template to render.
	 */
	protected employeeStatusRenderer: GridColumnBodyLitRenderer<Employee> = (employee) => {
		const { statusText, themeBadge } = processStatusBadge(employee.status)
		const createdAt = convertDateTime(employee.created_at)
		return html`
			<div class="flex flex-col items-start status-column py-s">
				${Badge({ 
					text: statusText, 
					theme: `${themeBadge} small`, 
					className: "status-badge" 
				})}
				<div class="text-s text-secondary">
					${employee.last_sign_in_at 
						? html`
								Last login 
								<relative-time 
									tense="past" 
									datetime=${employee.last_sign_in_at}>
								</relative-time>
							` 
						: html`<span>Never signed in</span>`}
				</div>
				<div class="text-s text-body">
					Joined ${createdAt}
				</div>
			</div>
		`
	}

	protected template() {
		return html`
			<vaadin-grid
				@cell-activate=${this.handleCellActivate}
				.items=${employeesStore.get()}
				.cellPartNameGenerator=${this.generatePart}
				theme="no-border no-row-borders"
				class="h-full transparent-body no-header">
				<vaadin-grid-selection-column .autoWidth=${true}>
				</vaadin-grid-selection-column>
				<vaadin-grid-column .width=${"18rem"}
					${columnBodyRenderer(this.employeeInfoRenderer, [profileAvatarStore.get()])}
				></vaadin-grid-column>
				<vaadin-grid-column .width=${"12rem"} .flexGrow=${3}
					${columnBodyRenderer(this.employeeStatusRenderer)}
				></vaadin-grid-column>
			</vaadin-grid>
		`
	}
	
}
