import { html } from "lit-html"
import { Badge } from "@components/Badge.ts"
import { GridBase } from "@base/grid/GridBase.ts"
import { processStatusBadge } from "@utils/utils.ts"
import { SearchBar } from "@components/SearchBar.ts"
import { columnBodyRenderer } from "@vaadin/grid/lit.js"
import { starshipsStore } from "@store/gridData.store.ts"
import { starshipHeroStore } from "@store/fileUrl.store.ts"
import { StarshipDetails } from "@components/panels/StarshipDetails.ts"
import type { Starship } from "../../types.ts"
import type { GridColumnBodyLitRenderer } from "@vaadin/grid/lit.js"
import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js"
import type { CheckboxGroupValueChangedEvent } from "@vaadin/checkbox-group"

export class StarshipsGrid extends GridBase<Starship> {

	static #instance: StarshipsGrid
	protected searchBarInstance: SearchBar | null = null

	constructor() {
		super("#starshipsView")
		this.setupSearchBar()
		this.initializeGridBase()
		this.connectRealtimeChannel()
		if (!!StarshipsGrid.#instance) {
			return StarshipsGrid.#instance
		}
		StarshipsGrid.#instance = this
	}

	static getInstance() {
		if (!StarshipsGrid.#instance) {
			new StarshipsGrid()
		}
		return StarshipsGrid.#instance
	}

	protected getRecordsStore() {
		return starshipsStore
	}

	protected getHeroConfig() {
		return { 
			heroField: "hero_image", 
			heroStore: starshipHeroStore 
		}
	}

	protected getDbTableName() {
		return "starships"
	}

	protected getRealtimeChannelName() {
		return "RealtimeChannelStarships"
	}

	public getGridUrlRoute() {
		return "/ships/starships"
	}

	protected getSearchableFields(starship: Starship) {
		return [
			starship.make, 
			starship.model, 
			starship.year.toString(), 
			starship.status
		]
	}

	protected afterRecordUpdated(payload: RealtimePostgresUpdatePayload<Starship>) {
		const urlReference = this.getUrlReference()
		const starshipReference =  payload.new.reference.toString()
		if (urlReference === starshipReference) {
			StarshipDetails.getInstance().updateDetails(payload.new)
		}
	}

	protected setupSearchBar() {
		this.searchBarInstance = new SearchBar({ 
			selector: ".starships-view header",
			filterButton: true,
			onSearch: (searchTerm) => this.handleSearch(searchTerm),
			popoverTemplate: () => this.popoverTemplate()
		})
	}

	protected handleFilterValueChanged = (event: CheckboxGroupValueChangedEvent) => {
		super.handleFilterValueChanged(event)
		if (this.searchBarInstance) {
			this.searchBarInstance.updateOptions({ filterCounter: this.activeFiltersCount })
		}
	}

	protected popoverTemplate = () => {
		return html`
			<div class="p-s">
				<div class="flex items-center justify-between">
					<h3 class="text-l text-header font-medium">
						Filters
					</h3>
					<vaadin-button
						@click=${this.closePopover} 
						theme="icon small tertiary contrast">
						<vaadin-icon src="/close.svg"></vaadin-icon>
					</vaadin-button>
				</div>
				<div id="checkboxGroupContainer" class="flex flex-col">
					<vaadin-checkbox-group
						@value-changed=${this.handleFilterValueChanged} 
						label="Status"
						theme="vertical"
						data-group="status">
						<vaadin-checkbox value="available" label="Available"></vaadin-checkbox>
						<vaadin-checkbox value="maintenance" label="Maintenance"></vaadin-checkbox>
						<vaadin-checkbox value="rented" label="Rented"></vaadin-checkbox>
					</vaadin-checkbox-group>
					<vaadin-checkbox-group
						@value-changed=${this.handleFilterValueChanged} 
						label="Year"
						theme="vertical"
						data-group="year">
						<vaadin-checkbox value="2085" label="2085"></vaadin-checkbox>
						<vaadin-checkbox value="2075" label="2075"></vaadin-checkbox>
						<vaadin-checkbox value="2102" label="2102"></vaadin-checkbox>
					</vaadin-checkbox-group>
					<vaadin-button 
						@click=${this.clearFilters} 
						theme="outline" 
						class="text-body mt-m">
						Clear Filters
					</vaadin-button>
				</div>
			</div>
		`
	}

	protected starshipsMakeRenderer: GridColumnBodyLitRenderer<Starship> = (starship) => {
		return html`
			<a 
				@click=${this.handleAnchorNavigation}
				class="font-semibold" 
				href="/ships/starships/${starship.reference}">
				${starship.make}
			</a>
		`
	}

	protected starshipsStatusRenderer: GridColumnBodyLitRenderer<Starship> = (starship) => {
		const { statusText, themeBadge } = processStatusBadge(starship.status)
		return Badge({
			text: statusText,
			theme: themeBadge
		})
	}

	protected template() {
		return html`
			<vaadin-grid
				@cell-activate=${this.handleCellActivate}
				.items=${starshipsStore.get()}
				.cellPartNameGenerator=${this.generatePart}
				theme="no-border"
				class="h-full transparent-body">
				<vaadin-grid-column 
					.width=${"9rem"} 
					.path=${"make"}
					${columnBodyRenderer(this.starshipsMakeRenderer)}>
				</vaadin-grid-column>
				<vaadin-grid-column 
					.width=${"8rem"} 
					.path=${"model"}>
				</vaadin-grid-column>
				<vaadin-grid-column 
					.width=${"5rem"} 
					.path=${"year"}>
				</vaadin-grid-column>
				<vaadin-grid-column 
					.width=${"8rem"} 
					.path=${"status"}
					${columnBodyRenderer(this.starshipsStatusRenderer)}>
				</vaadin-grid-column>
			</vaadin-grid>
		`
	}
	
}
