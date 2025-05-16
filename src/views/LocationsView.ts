import { html } from "lit-html"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import "@styles/locations-view.css"

export class LocationsView {

	static #instance: LocationsView

	constructor() {
		this.render()
		if (!!LocationsView.#instance) {
			return LocationsView.#instance
		}
		LocationsView.#instance = this
	}

	template() {
		return html`
			<div class="Panels has-persistent-active View locations-view">
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
									<h1>Locations</h1>
								`
							})}
							<vaadin-scroller 
								id="locationsView" 
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
