import { html } from "lit-html"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import "@styles/customers-view.css"

export class CustomersView {

	static #instance: CustomersView

	constructor() {
		this.render()
		if (!!CustomersView.#instance) {
			return CustomersView.#instance
		}
		CustomersView.#instance = this
	}

	template() {
		return html`
			<div class="Panels has-persistent-active View customers-view">
				<div 
					class="Panels-panel" 
					data-active="true" 
					data-persistent="true" 
					data-placeholder="false" 
					data-overlay="false">
					<div class="Panels-panel-wrapper">
						<div class="View">
							${HeaderSection({
								templateContent: html`<h1>Customers</h1>`
							})}
							<vaadin-scroller 
								id="customersView" 
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
