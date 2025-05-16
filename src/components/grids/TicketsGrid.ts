import { html } from "lit-html"
import { Badge } from "@components/Badge.ts"
import { GridBase } from "@base/grid/GridBase.ts"
import { ticketsStore } from "@store/gridData.store.ts"
import { columnBodyRenderer } from "@vaadin/grid/lit.js"
import { processStatusBadge, convertDateTime } from "@utils/utils.ts"
import type { Tickets } from "../../types.ts"
import type { GridColumnBodyLitRenderer } from "@vaadin/grid/lit.js"
import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js"
import "@styles/tickets-grid.css"

export class TicketsGrid extends GridBase<Tickets> {

	static #instance: TicketsGrid

	constructor() {
		super("#ticketsView")
		this.initializeGrid()
		this.connectRealtimeChannel()
		if (!!TicketsGrid.#instance) {
			return TicketsGrid.#instance
		}
		TicketsGrid.#instance = this
	}

	static getInstance() {
		if (!TicketsGrid.#instance) {
			new TicketsGrid()
		}
		return TicketsGrid.#instance
	}

	protected getRecordsStore() {
		return ticketsStore
	}

	protected getDbTableName() {
		return "tickets"
	}

	protected getRealtimeChannelName() {
		return "RealtimeChannelTickets"
	}

	protected getDbQuery() {
		return `
			id, created_at, reference, pickup_date, return_date, status, total_cost, rent_duration,
			customers (reference, first_name, last_name, nationality, language, age, email, phone, address),
			starships (reference, make, model, year, fuel_type, mileage),
			pickup_location:locations!tickets_pickup_location_fkey (name, reference),
			return_location:locations!tickets_return_location_fkey (name, reference)
		`
	}

	public getGridUrlRoute() {
		return "/rentals/tickets"
	}

	protected afterRecordUpdated(payload: RealtimePostgresUpdatePayload<Tickets>) {
		const urlReference = this.getUrlReference()
		const ticketReference =  payload.new.reference.toString()
		if (urlReference === ticketReference) {
			//TicketDetails.getInstance().updateDetails(payload.new)
		}
	}

	protected ticketRenderer: GridColumnBodyLitRenderer<Tickets> = (ticket) => {
		const { themeBadge, statusText } = processStatusBadge(ticket.status)
		const pickUpDate = convertDateTime(ticket.pickup_date)
		const returnDate = convertDateTime(ticket.return_date)
		return html`
			<div class="ticket-row flex flex-col" aria-label="Ticket Details">
				<div class="flex flex-wrap items-center gap-x-l gap-y-s">
					<div class="flex items-center gap-s">
						<a 
							@click=${this.handleAnchorNavigation} 
							class="font-semibold text-l" 
							href="/rentals/tickets/${ticket.reference}"
							aria-label="Ticket Reference: ${ticket.reference}">
							${ticket.reference}
						</a>
					</div>
					${Badge({ 
						text: statusText, 
						theme: themeBadge, 
						className: "status ms-auto", 
						"aria-label": `Status: ${statusText}` 
					})}
				</div>
				<div class="flex pt-m pb-m" aria-label="Ticket Rental Information">
					<div class="rented-in" aria-label="Pickup Information">
						<small class="text-secondary" aria-hidden="true">Rented in</small>
						<div class="rent-location" aria-label="Pickup Location">
							${ticket.pickup_location.name}
						</div>
						<div class="date" aria-label="Pickup Date">
							on ${pickUpDate}
						</div>
					</div>
					<div class="duration" aria-label="Rental Duration: ${ticket.rent_duration} days">
						<vaadin-icon src="/location-right.svg" aria-hidden="true"></vaadin-icon>
						<br>
						<span>Rented for ${ticket.rent_duration} days</span>
					</div>
					<div class="deliver-in" aria-label="Return Information">
					<small class="text-secondary" aria-hidden="true">Deliver in</small>
						<div class="rent-location" aria-label="Return Location">
							${ticket.return_location.name}
						</div>
						<div class="date" aria-label="Return Date">
							on ${returnDate}
						</div>
					</div>
				</div>
				<div class="footer pt-xs flex flex-wrap gap-x-l gap-y-s">
					<div class="flex items-center gap-s font-semibold" aria-label="Customer Name">
						<vaadin-icon src="/user.svg" aria-hidden="true"></vaadin-icon>
						<span>${ticket.customers.first_name} ${ticket.customers.last_name}</span>
					</div>
					<div class="flex items-center gap-s text-secondary" aria-label="Starship Make">
						<vaadin-icon src="/rocket.svg" aria-hidden="true"></vaadin-icon>
						<span>${ticket.starships.make}</span>
					</div>
					<div class="flex items-center gap-s text-secondary" aria-label="Total Cost">
						<vaadin-icon src="/dollar.svg" aria-hidden="true"></vaadin-icon>
						<span>${ticket.total_cost} Novacoins</span>
					</div>
				</div>
			</div>`
	}

	protected template() {
		return html`
			<vaadin-grid
				@select-item=${this.handleActivateItem}
				@deselect-item=${this.handleDeactivateItem}
				@cell-activate=${this.handleCellActivate}
				.items=${ticketsStore.get()}
				theme="no-border"
				class="h-full transparent-body no-header">
				<vaadin-grid-column
					${columnBodyRenderer(this.ticketRenderer)}
				></vaadin-grid-column>
			</vaadin-grid>
		`
	}

}
