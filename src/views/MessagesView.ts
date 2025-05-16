import { html } from "lit-html"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import "@styles/messages-view.css"

export class MessagesView {

	static #instance: MessagesView

	constructor() {
		this.render()
		if (!!MessagesView.#instance) {
			return MessagesView.#instance
		}
		MessagesView.#instance = this
	}

	template() {
		return html`
			<div class="Panels has-persistent-active View messages-view">
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
									<h1>My Messages</h1>
									<vaadin-button theme="icon tertiary contrast">
										<vaadin-icon src="/edit.svg"></vaadin-icon>
										<vaadin-tooltip
											slot="tooltip" 
											text="New Message">
										</vaadin-tooltip>
									</vaadin-button>
								`
							})}
							<vaadin-scroller 
								id="messagesView" 
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
