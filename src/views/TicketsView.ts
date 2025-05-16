import { html } from "lit-html"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import "@styles/tickets-view.css"

export class TicketsView {

	static #instance: TicketsView

	constructor() {
		this.render()
		if (!!TicketsView.#instance) {
			return TicketsView.#instance
		}
		TicketsView.#instance = this
	}

	template() {
		return html`
			<div class="Panels has-persistent-active View tickets-view">
				<div 
					class="Panels-panel" 
					data-active="true" 
					data-persistent="true" 
					data-placeholder="false" 
					data-overlay="false">
					<div class="Panels-panel-wrapper">
						<div class="View">
							${HeaderSection({
								templateContent: html`<h1>Tickets</h1>`
							})}
							<vaadin-scroller 
								id="ticketsView" 
								theme="overflow-indicators" 
								class="View-content">
							</vaadin-scroller>
						</div>
					</div>
				</div>
			</div>
		`
	}
	
	render() {
		observeAndRender({ 
			template: this.template(),
			targetSelector: ".View-container",
			renderOptions: { host: this }
		})
	}

}
