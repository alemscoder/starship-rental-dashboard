import { html } from "lit-html"
import { GridBase } from "@base/grid/GridBase.ts"
import { columnBodyRenderer } from "@vaadin/grid/lit.js"
import { customersStore } from "@store/gridData.store.ts"
import { CustomerDetails } from "@components/panels/CustomerDetails.ts"
import type { Customer } from "../../types.ts"
import type { GridColumnBodyLitRenderer } from "@vaadin/grid/lit.js"
import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js"

export class CustomersGrid extends GridBase<Customer> {

	static #instance: CustomersGrid

	constructor() {
		super("#customersView")
		this.initializeGridBase()
		this.connectRealtimeChannel()
		if (!!CustomersGrid.#instance) {
			return CustomersGrid.#instance
		}
		CustomersGrid.#instance = this
	}

	static getInstance() {
		if (!CustomersGrid.#instance) {
			new CustomersGrid()
		}
		return CustomersGrid.#instance
	}

	protected getRecordsStore() {
		return customersStore
	}

	protected getDbTableName() {
		return "customers"
	}

	protected getRealtimeChannelName() {
		return "RealtimeChannelCustomers"
	}

	public getGridUrlRoute() {
		return "/rentals/customers"
	}

	protected afterRecordUpdated(payload: RealtimePostgresUpdatePayload<Customer>) {
		const urlReference = this.getUrlReference()
		const customerReference =  payload.new.reference.toString()
		if (urlReference === customerReference) {
			CustomerDetails.getInstance().updateDetails(payload.new)
		}
	}

	protected customersRenderer: GridColumnBodyLitRenderer<Customer> = (customer) => {
		return html`
			<a 
				@click=${this.handleAnchorNavigation}
				class="font-semibold" 
				href="/rentals/customers/${customer.reference}">
				${customer.first_name} ${customer.last_name}
			</a>
		`
	}

	protected template() {
		return html`
			<vaadin-grid
				@cell-activate=${this.handleCellActivate}
				.items=${customersStore.get()}
				.cellPartNameGenerator=${this.generatePart}
				theme="no-border"
				class="h-full transparent-body">
				<vaadin-grid-column 
					.width=${"10rem"} 
					.path=${"name"}
					${columnBodyRenderer(this.customersRenderer)}
				></vaadin-grid-column>
				<vaadin-grid-column 
					.width=${"18rem"} 
					.path=${"email"}>
				</vaadin-grid-column>
				<vaadin-grid-column 
					.width=${"8rem"} 
					.path=${"driver_license"} 
					.header=${"Driver's license"}>
				</vaadin-grid-column>
				<vaadin-grid-column 
					.width=${"6rem"} 
					.path=${"age"}>
				</vaadin-grid-column>
			</vaadin-grid>
		`
	}
	
}
