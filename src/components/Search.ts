import { html } from "lit-html"
import { Badge } from "@components/Badge.ts"

export function Search() {

	const openSearchDialog = async () => {
		const { SearchDialog } = await import("@components/dialogs/SearchDialog.ts")
		const searchDialog = new SearchDialog()
		searchDialog.open()
	}

	const template = () => {
		const isRootPathname = location.pathname === "/"
		return html`
			<vaadin-button 
				@click=${openSearchDialog} 
				id="searchButton"
				class=${isRootPathname ? "w-full mt-m mb-m border border-contrast-40" : ""}
				theme="tertiary contrast ${isRootPathname ? "" : "icon"}">
				<vaadin-icon 
					slot=${isRootPathname ? "prefix" : ""} 
					src="/search.svg">
				</vaadin-icon>
				${ isRootPathname
					? html`
						<div>Search</div>
						${Badge({ text: "^K", theme: "small dimmed", slot: "suffix" })}
					`
					: html`
						<vaadin-tooltip
							slot="tooltip" 
							text="Search" 
							position="start">
						</vaadin-tooltip>
					`
				}
			</vaadin-button>
		`
	}

	return html`
		${template()}
	`

}
