import { html } from "lit-html"
import router from "@router/router.ts"
import { Badge } from "@components/Badge.ts"
import { ticketsStore } from "@store/gridData.store.ts"
import { DetailsBase } from "@base/panel/DetailsBase.ts"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { TicketsGrid } from "@components/grids/TicketsGrid.ts"
import { processStatusBadge, convertDateTime } from "@utils/utils.ts"
import type { Ticket } from "../../types.ts"
import "@styles/ticket-details.css"

export class TicketDetails extends DetailsBase<Ticket> {

	static #instance: TicketDetails
	#initializationPromise: Promise<void> | null = null

	constructor() {
		super(".tickets-view")
		if (!!TicketDetails.#instance) {
			return TicketDetails.#instance
		}
		TicketDetails.#instance = this
	}

	static getInstance(options = { skipInitialization: false }) {
		const { skipInitialization } = options
		if (!TicketDetails.#instance) {
			new TicketDetails()
		}
		if (!skipInitialization) {
			TicketDetails.#instance.initializeTicketDetails()
		}
		return TicketDetails.#instance
	}

	protected async initializeTicketDetails() {
		this.#initializationPromise = (async () => {
			await TicketsGrid.getInstance().waitForInitialization()
			try {
				this.data = this.getDataByReference()
			} catch (error) {
				router.navigate(TicketsGrid.getInstance().getGridUrlRoute())
				return
			}
			TicketsGrid.getInstance().setGridActiveItem(this.data)
			this.render()
		})()
		return this.#initializationPromise
	}

	public async waitForInitialization() {
		return this.#initializationPromise ?? Promise.resolve()
	}

	protected getRecordsStore() {
		return ticketsStore 
	}

	public updateTicketDetails(ticket: Ticket) {
		this.data = ticket
		this.render()
	}

	public closeDetails() {
		TicketsGrid.getInstance().setGridActiveItem(null)
		router.navigate(TicketsGrid.getInstance().getGridUrlRoute())
	}

	protected async openEditTicketDialog() {
		const { EditTicketDialog } = await import("@components/dialogs/EditTicketDialog.ts")
		const editTicketDialog = new EditTicketDialog()
		editTicketDialog.open()
	}

	protected headerTemplate = () => {
		const { themeBadge, statusText } = processStatusBadge(this.data?.status)
		const createdAt = convertDateTime(this.data?.created_at)
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
					<div class="flex-auto flex items-center gap-m me-s mt-s">
						<div>
							<h2>Ticket Details</h2>
							<time class="text-s text-secondary ms-s" datetime=${createdAt}>
								Create at ${createdAt}
							</time>
							<div class="text-s text-secondary ms-s font-semibold">
								${this.data?.reference}
							</div>
						</div>
						${Badge({ 
							text: statusText, 
							theme: themeBadge, 
							className: "status ms-auto" 
						})}
					</div>
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

	protected bodyRentTemplate = () => {
		const pickUpDate = convertDateTime(this.data?.pickup_date)
		const returnDate = convertDateTime(this.data?.return_date)
		return html`
			<div tab="rent">
				<div class="flex flex-col py-m gap-m">
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/flight-up.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Rented in</h5>
							<a href="/rentals/locations/${this.data?.pickup_location.reference}">
								${this.data?.pickup_location.name}
							</a>
							<div>on ${pickUpDate}</div>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/flight-down.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Deliver in</h5>
							<a href="/rentals/locations/${this.data?.return_location.reference}">
								${this.data?.return_location.name}
							</a>
							<div>on ${returnDate}</div>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/clock.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Duration</h5>
							<div>${this.data?.rent_duration}</div>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/dollar.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Total cost</h5>
							<div>${this.data?.total_cost} Novacoins</div>
						</div>
					</div>
				</div>
			</div>
		`
	}

	protected bodyCustomerTemplate = () => {
		return html`
			<div tab="customer">
				<div class="flex flex-col py-m gap-m">
					<h4>Personal Information</h4>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/user.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Full Name</h5>
							<a href="/rentals/customers/${this.data?.customer.reference}">
								${this.data?.customer.first_name} ${this.data?.customer.last_name}
							</a>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/nationality.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Nationality</h5>
							<div>${this.data?.customer.nationality}</div>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/language.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Language</h5>
							<div>${this.data?.customer.language}</div>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/calendar.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Age</h5>
							<div>${this.data?.customer.age}</div>
						</div>
					</div>
					<hr>
					<h4>Contact Information</h4>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/email.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Email</h5>
							<a href="mailto:${this.data?.customer.email}">
								${this.data?.customer.email}
							</a>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/phone.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Phone</h5>
							<a href="tel:${this.data?.customer.phone}">
								${this.data?.customer.phone}
							</a>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/address.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Address</h5>
							<div>${this.data?.customer.address}</div>
						</div>
					</div>
				</div>
			</div>
		`
	}

	protected bodyStarshipTemplate = () => {
		return html`
			<div tab="starship">
				<div class="flex flex-col py-m gap-m">
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/rocket.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Make</h5>
							<a href="/ships/starships/${this.data?.starship.reference}">
								${this.data?.starship.make}
							</a>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/engine.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Model</h5>
							<div>${this.data?.starship.model}</div>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/calendar.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Year</h5>
							<div>${this.data?.starship.year}</div>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/fuel-type.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Fuel type</h5>
							<div>${this.data?.starship.fuel_type}</div>
						</div>
					</div>
					<div class="flex items-center gap-m leading-s">
						<vaadin-icon class="boxed-icon" src="/mileage.svg"></vaadin-icon>
						<div>
							<h5 class="text-s m-0">Mileage</h5>
							<div>${this.data?.starship.mileage}</div>
						</div>
					</div>
				</div>
			</div>
		`
	}

	protected bodyTemplate = () => {
		return html`
			<vaadin-scroller theme="overflow-indicators" class="View-content">
				<vaadin-tabsheet class="ticket-details h-full flex-1">
					<vaadin-tabs slot="tabs">
						<vaadin-tab id="rent">Rent</vaadin-tab>
						<vaadin-tab id="customer">Customer</vaadin-tab>
						<vaadin-tab id="starship">Starship</vaadin-tab>
					</vaadin-tabs>
					${this.bodyRentTemplate()}
					${this.bodyCustomerTemplate()}
					${this.bodyStarshipTemplate()}
				</vaadin-tabsheet>
			</vaadin-scroller>
		`
	}

	protected footerTemplate = () => {
		return html`
			<footer class="View-footer">
				<div class="flex flex-col gap-s items-stretch p-m">
					<vaadin-button
						@click=${this.openEditTicketDialog}
						id="editTicketButton" 
						theme="outline" 
						class="flex-auto">
						Update
					</vaadin-button>
					<div class="flex gap-s">
						<vaadin-button 
							theme="outline" 
							class="flex-auto">
							Refund
						</vaadin-button>
						<vaadin-button 
							theme="error outline" 
							class="flex-auto">
							Cancel Ticket
						</vaadin-button>
					</div>
				</div>
			</footer>
		`
	}

}
