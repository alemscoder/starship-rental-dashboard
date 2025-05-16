import { html } from "lit-html"

export function Search() {

	const openSearchDialog = async () => {
		const { SearchDialog } = await import("@components/dialogs/SearchDialog.ts")
		const searchDialog = new SearchDialog()
		searchDialog.open()
	}

	const template = html`
		<vaadin-button 
			@click=${openSearchDialog} 
			id="searchButton" 
			theme="tertiary contrast icon">
			<vaadin-icon src="/search.svg"></vaadin-icon>
			<vaadin-tooltip
				slot="tooltip" 
				text="Search / Command Palette (^K)" 
				position="start">
			</vaadin-tooltip>
		</vaadin-button>
	`

	return html`
		${template}
	`

}
