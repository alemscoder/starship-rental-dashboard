import { html } from "lit-html"
import { GridBase } from "@base/grid/GridBase.ts"
import { setGravityTheme } from "@utils/utils.ts"
import { columnBodyRenderer } from "@vaadin/grid/lit.js"
import { locationsStore } from "@store/gridData.store.ts"
import { LocationDetails } from "@components/panels/LocationDetails.ts"
import { planetAvatarStore, locationLandscapeStore } from "@store/fileUrl.store.ts"
import type { Locations } from "../../types.ts"
import type { GridColumnBodyLitRenderer } from "@vaadin/grid/lit.js"
import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js"

export class LocationsGrid extends GridBase<Locations> {

	static #instance: LocationsGrid

	constructor() {
		super("#locationsView")
		this.initializeGrid()
		this.connectRealtimeChannel()
		if (!!LocationsGrid.#instance) {
			return LocationsGrid.#instance
		}
		
		LocationsGrid.#instance = this
	}

	static getInstance() {
		if (!LocationsGrid.#instance) {
			new LocationsGrid()
		}
		return LocationsGrid.#instance
	}

	protected getRecordsStore() {
		return locationsStore
	}

	protected getAvatarConfig() {
		return { 
			avatarField: "planet_avatar", 
			avatarStore: planetAvatarStore 
		}
	}

	protected getHeroConfig() {
		return { 
			heroField: "location_landscape", 
			heroStore: locationLandscapeStore 
		}
	}

	protected getDbTableName() {
		return "locations"
	}

	protected getRealtimeChannelName() {
		return "RealtimeChannelLocations"
	}

	public getGridUrlRoute() {
		return "/rentals/locations"
	}

	protected afterRecordUpdated(payload: RealtimePostgresUpdatePayload<Locations>) {
		const urlReference = this.getUrlReference()
		const locationReference =  payload.new.reference.toString()
		if (urlReference === locationReference) {
			LocationDetails.getInstance().updateDetails(payload.new)
		}
	}

	protected locationsNameRenderer: GridColumnBodyLitRenderer<Locations> = (location) => {
		return html`
			<a 
				@click=${this.handleAnchorNavigation}
				class="font-semibold" 
				href="/rentals/locations/${location.reference}">
				${location.name}
			</a>
		`
	}

	protected locationsGravityRenderer: GridColumnBodyLitRenderer<Locations> = (location) => {
		const theme = setGravityTheme(location.gravity)
		return html`
			<vaadin-progress-bar
				.value=${location.gravity}
				.max=${2.5} 
				theme=${theme}
				title="${location.gravity * 100}% Earth's gravity"
				aria-label="${location.gravity * 100}% Earth's gravity">
			</vaadin-progress-bar>
		`
	}

	protected template() {
		return html`
			<vaadin-grid
				@activate-item=${this.handleActivateItem}
				@deactivate-item=${this.handleDeactivateItem}
				@cell-activate=${this.handleCellActivate}
				.items=${locationsStore.get()}
				.cellPartNameGenerator=${this.generatePart}
				theme="no-border"
				class="h-full transparent-body">
				<vaadin-grid-sort-column 
					.width=${"20rem"} 
					.path=${"name"}
					${columnBodyRenderer(this.locationsNameRenderer)}
				></vaadin-grid-sort-column>
				<vaadin-grid-column 
					.width=${"20rem"} 
					.path=${"hours_of_operation"} 
					.header=${"Hours of operation"}>
				</vaadin-grid-column>
				<vaadin-grid-column 
					.width=${"13rem"} 
					.path=${"coordinates"}>
				</vaadin-grid-column>
				<vaadin-grid-sort-column
					.width=${"6rem"}
					.path=${"gravity"} 
					${columnBodyRenderer(this.locationsGravityRenderer)}
				></vaadin-grid-sort-column>
			</vaadin-grid>
		`
	}
	
}
