import { html } from "lit-html"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"

export class InvoicesView {

	static #instance: InvoicesView

	constructor() {
		this.render()
		if (!!InvoicesView.#instance) {
			return InvoicesView.#instance
		}
		InvoicesView.#instance = this
	}

	template() {
		return html`
			<div class="Panels has-persistent-active View invoices-view">
				<div 
					class="Panels-panel" 
					data-active="true" 
					data-persistent="true" 
					data-placeholder="false" 
					data-overlay="false">
					<div class="Panels-panel-wrapper">
						<div class="View">
							${HeaderSection({
								templateContent: html`<h1>Invoices</h1>`
							})}
							<vaadin-scroller 
								id="invoicesView" 
								theme="overflow-indicators" 
								class="View-content">
								<div class="h-full box-border flex items-center justify-center p-xl text-center">
									Empty view.
								</div>
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
