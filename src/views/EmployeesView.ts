import { html, nothing } from "lit-html"
import { userDataStore } from "@store/userData.store.ts"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import "@styles/employees-view.css"

/**
 * Represents the view for managing employees in the application.
 * 
 * The `EmployeesView` class is implemented as a singleton, ensuring that 
 * only one instance of the view exists at any given time. It handles 
 * rendering the employee management interface, including features such 
 * as displaying a header, search bar, and the ability to open a dialog 
 * for adding new employees.
 */
export class EmployeesView {

	/** A private static property to hold the 
	 * singleton instance of `EmployeesView` 
	 * @private
	*/
	static #instance: EmployeesView

	/**
	 * Constructs an instance of `EmployeesView` and initializes
	 * render method. If an instance already exists, it returns 
	 * the existing instance (singleton pattern), ensuring 
	 * only one instance of the class is active at a time.
	 */
	constructor() {
		this.render()
		if (!!EmployeesView.#instance) {
			return EmployeesView.#instance
		}
		EmployeesView.#instance = this
	}

	/**
	 * Opens the dialog to add a new employee.
	 * This method uses dynamic import to lazily load the `NewEmployeeDialog` component,
	 * improving the initial loading performance of the application.
	 * @async
	 */
	async openNewEmployeeDialog() {
		const { NewEmployeeDialog } = await import("@components/dialogs/NewEmployeeDialog.ts")
		const newEmployeeDialog = new NewEmployeeDialog()
		newEmployeeDialog.open()
	}

	/**
	 * Builds the lit-html template for the employees view.
	 * @returns A lit-html `TemplateResult` representing the view.
	 */
	template() {
		const loggedInUserRole = userDataStore.get()?.role
		return html`
			<div class="Panels has-persistent-active View employees-view">
				<div 
					class="Panels-panel" 
					data-active="true" 
					data-persistent="true" 
					data-placeholder="false" 
					data-overlay="false">
					<div class="Panels-panel-wrapper">
						<div class="View">
							${HeaderSection({
								templateContent: html`
									<h1>Employees</h1>
									${loggedInUserRole === "admin"
										? html`
											<vaadin-button
												@click=${this.openNewEmployeeDialog}
												id="newEmployeeButton"
												theme="icon tertiary contrast">
												<vaadin-icon src="/plus.svg"></vaadin-icon>
												<vaadin-tooltip
													slot="tooltip" 
													text="New Employee">
												</vaadin-tooltip>
											</vaadin-button>
										`
										: nothing
									}
								`
							})}
							<vaadin-scroller 
								id="employeesView" 
								theme="overflow-indicators" 
								class="View-content">
							</vaadin-scroller>
						</div>
					</div>
				</div>
			</div>
		`
	}

	/**
	 * Observes the target DOM node and renders the template.
	 */
	render() {
		observeAndRender({ 
			template: this.template(),
			targetSelector: ".View-container",
			renderOptions: { host: this }
		})
	}

}
