import { html } from "lit-html"
import { Badge } from "@components/Badge.ts"
import { GridBase } from "@base/grid/GridBase.ts"
import { ticketsStore } from "@store/gridData.store.ts"
import { columnBodyRenderer } from "@vaadin/grid/lit.js"
import { getTicketSelect, processStatusBadge, convertDateTime } from "@utils/utils.ts"
import type { Ticket } from "../../types.ts"
import type { GridColumnBodyLitRenderer } from "@vaadin/grid/lit.js"
import "@styles/tickets-grid.css"

export class TicketsGrid extends GridBase<Ticket> {

	static #instance: TicketsGrid

	constructor() {
		super("#ticketsView")
		this.initializeTicketsGrid()
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

	protected getDbQuery() {
		return getTicketSelect()
	}

	protected getDbOrder() {
		return { column: "reference", options: { ascending: false } }
	}

	public getGridUrlRoute() {
		return "/rentals/tickets"
	}

	protected async initializeTicketsGrid() {
		await this.initializeGridBase()
		const grid = this.getGridElement()
		this.updateGridItems(grid)
	}

	public addTicket(ticket: Ticket) {
		const prevTickets = ticketsStore.get() ?? []
		if (prevTickets.some(t => t.id === ticket.id)) return
		const result = prevTickets 
			? [ticket, ...prevTickets ]
			: [ticket]
		ticketsStore.set(result)
		const grid = this.getGridElement()
		this.updateGridItems(grid)
	}

	public editTicket(ticket: Ticket) {
		const prevTickets = ticketsStore.get() ?? []
		const exists = prevTickets.some(t => t.id === ticket.id)
		const result = exists
			? prevTickets.map(t => (t.id === ticket.id ? ticket : t))
			: [ticket, ...prevTickets]
		ticketsStore.set(result)
		const grid = this.getGridElement()
		this.updateGridItems(grid)
	}

	public deleteTicket(ticket: Ticket) {
		const prevTickets = ticketsStore.get() ?? []
		const result = prevTickets
		? prevTickets.filter((t) => t.id !== ticket.id)
		: []
		ticketsStore.set(result)
		const grid = this.getGridElement()
		this.updateGridItems(grid)
	}

	protected ticketRenderer: GridColumnBodyLitRenderer<Ticket> = (ticket) => {
		const { themeBadge, statusText } = processStatusBadge(ticket.status)
		const createdAt = convertDateTime(ticket.created_at)
		const pickUpDate = convertDateTime(ticket.pickup_date)
		const returnDate = convertDateTime(ticket.return_date)
		return html`
			<div class="ticket-row flex flex-col" aria-label="Ticket Details">
				<div class="flex flex-wrap items-center gap-x-l gap-y-s">
					<div class="flex flex-col items-start gap-xs">
						<time class="text-s text-secondary" datetime=${createdAt}>
							Create at ${createdAt}
						</time>
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
					<div class="duration" aria-label="Rental Duration: ${ticket.rent_duration}">
						<vaadin-icon src="/location-right.svg" aria-hidden="true"></vaadin-icon>
						<br>
						<span>Rented for ${ticket.rent_duration}</span>
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
						<span>${ticket.customer.first_name} ${ticket.customer.last_name}</span>
					</div>
					<div class="flex items-center gap-s text-secondary" aria-label="Starship Make">
						<vaadin-icon src="/rocket.svg" aria-hidden="true"></vaadin-icon>
						<span>${ticket.starship.make}</span>
					</div>
					<div class="flex items-center gap-s text-secondary" aria-label="Total Cost">
						<vaadin-icon src="/dollar.svg" aria-hidden="true"></vaadin-icon>
						<span>${ticket.total_cost} Novacoins</span>
					</div>
				</div>
			</div>`
	}

	protected template = () => {
		return html`
			<vaadin-grid
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
