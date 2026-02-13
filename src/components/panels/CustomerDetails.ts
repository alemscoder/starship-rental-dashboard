import { html } from "lit-html"
import router from "@router/router.ts"
import { DetailsBase } from "@base/panel/DetailsBase.ts"
import { customersStore } from "@store/gridData.store.ts"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { CustomersGrid } from "@components/grids/CustomersGrid.ts"
import type { Customer } from "../../types.ts"

export class CustomerDetails extends DetailsBase<Customer> {

	static #instance: CustomerDetails

	constructor() {
		super(".customers-view")
		this.initialize()
		if (!!CustomerDetails.#instance) {
			return CustomerDetails.#instance
		}
		CustomerDetails.#instance = this
	}

	static getInstance() {
		if (!CustomerDetails.#instance) {
			new CustomerDetails()
		}
		return CustomerDetails.#instance
	}

	protected async initialize() {
		await CustomersGrid.getInstance().waitForInitialization()
		this.data = this.getDataByReference()
		CustomersGrid.getInstance().setGridActiveItem(this.data)
		this.render()
	}

	protected getRecordsStore() {
		return customersStore 
	}

	public updateDetails(customerDetails: Customer) {
		this.data = customerDetails
		this.render()
	}

	protected closeDetails() {
		CustomersGrid.getInstance().setGridActiveItem(null)
		router.navigate(CustomersGrid.getInstance().getGridUrlRoute())
	}

	protected async openEditCustomerDialog() {
		const { EditCustomerDialog } = await import("@components/dialogs/EditCustomerDialog.ts")
		const editCustomerDialog = new EditCustomerDialog()
		editCustomerDialog.open()
	}

	headerTemplate() {
		return html`
			${HeaderSection({
				templateContent: html`
					<vaadin-button 
						@click=${this.closeDetails} 
						class="back" 
						theme="icon tertiary contrast">
						<vaadin-icon src="/arrow-left.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text="Back">
						</vaadin-tooltip>
					</vaadin-button>
					<h2>Customer Details</h2>
					<vaadin-button 
						@click=${this.openEditCustomerDialog}
						id="editCustomerButton" 
						theme="icon tertiary contrast">
						<vaadin-icon src="/edit.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text="Edit customer">
						</vaadin-tooltip>
					</vaadin-button>
					<vaadin-button 
						@click=${this.closeDetails} 
						class="close" 
						theme="icon tertiary contrast">
						<vaadin-icon src="/close.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text="Close">
						</vaadin-tooltip>
					</vaadin-button>
				`
			})}
		`
	}

	protected bodyTemplate = () => {
		return html`
			<vaadin-scroller theme="overflow-indicators" class="View-content">
				<div class="customer-profile-view flex flex-col px-m">
					<div class="flex flex-col py-m gap-m">
						<h4 class="text-m">Personal Information</h4>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/user.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Full Name</h5>
								<div>${this.data?.first_name} ${this.data?.last_name}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/nationality.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Nationality</h5>
								<div>${this.data?.nationality}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/language.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Language</h5>
								<div>${this.data?.language}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/calendar.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Date of birth</h5>
								<div>${this.data?.date_of_birth}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/birthday.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Age</h5>
								<div>${this.data?.age}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/driver_license.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Driver license</h5>
								<div>${this.data?.driver_license}</div>
							</div>
						</div>
						<h4 class="text-m mt-m">Contact Information</h4>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/email.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Email</h5>
								<a href="mailto:${this.data?.email}">
									${this.data?.email}
								</a>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/phone.svg">
							</vaadin-icon>
							<div>
								<h5 class="text-s m-0">Phone</h5>
								<a href="tel:${this.data?.phone}">
									${this.data?.phone}
								</a>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/address.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Address</h5>
								<div>${this.data?.address}</div>
							</div>
						</div>
					</div>
				</div>
			</vaadin-scroller>
		`
	}

	protected footerTemplate = () => {
		return html`
			<footer class="View-footer">
				<div class="flex flex-col gap-s items-stretch p-m">
					<vaadin-button theme="contrast">
						<vaadin-icon slot="prefix" src="/support.svg"></vaadin-icon>
						Send Message
					</vaadin-button>
				</div>
			</footer>
		`
	}

}
