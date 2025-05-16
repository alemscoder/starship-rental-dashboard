import { html, nothing } from "lit-html"
import { userDataStore } from "@store/userData.store.ts"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import "@styles/starships-view.css"

export class StarshipsView {

	static #instance: StarshipsView

	constructor() {
		this.render()
		if (!!StarshipsView.#instance) {
			return StarshipsView.#instance
		}
		StarshipsView.#instance = this
	}

	async openNewStarshipDialog() {
		const { NewStarshipDialog } = await import("@components/dialogs/NewStarshipDialog.ts")
		const newStarshipDialog = new NewStarshipDialog()
		newStarshipDialog.open()
	}

	template() {
		const loggedInUserRole = userDataStore.get()?.role
		return html`
			<div class="Panels has-persistent-active View starships-view">
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
									<h1>Starships</h1>
									${loggedInUserRole === "admin" || loggedInUserRole === "manager"
										? html`
											<vaadin-button
												@click=${this.openNewStarshipDialog}
												id="newStarshipButton"
												theme="icon tertiary contrast">
												<vaadin-icon src="/plus.svg"></vaadin-icon>
												<vaadin-tooltip
													slot="tooltip" 
													text="New Starship">
												</vaadin-tooltip>
											</vaadin-button>
										`
										: nothing
									}
									
								`
							})}
							<vaadin-scroller 
								id="starshipsView" 
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
