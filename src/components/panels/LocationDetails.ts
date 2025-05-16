import router from "@router/router.ts"
import { html, nothing } from "lit-html"
import { setGravityTheme } from "@utils/utils.ts"
import { downloadFile } from "@lib/utils.client.ts"
import { DetailsBase } from "@base/panel/DetailsBase.ts"
import { locationsStore } from "@store/gridData.store.ts"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { RentalsSideNav } from "@pages/rentals/RentalsSideNav.ts"
import { LocationsGrid } from "@components/grids/LocationsGrid.ts"
import { planetAvatarStore, locationLandscapeStore } from "@store/fileUrl.store.ts"
import type { Locations } from "../../types.ts"

export class LocationDetails extends DetailsBase<Locations> {

	static #instance: LocationDetails

	constructor() {
		super(".locations-view")
		this.initialize()
		if (!!LocationDetails.#instance) {
			return LocationDetails.#instance
		}
		LocationDetails.#instance = this
	}

	static getInstance() {
		if (!LocationDetails.#instance) {
			new LocationDetails()
		}
		return LocationDetails.#instance
	}

	protected async initialize() {
		await LocationsGrid.getInstance().waitForInitialization()
		this.data = this.getDataByReference()
		this.render()
	}

	protected getRecordsStore() {
		return locationsStore 
	}
	
	public updateDetails(locationDetails: Locations) {
		this.data = locationDetails
		this.render()
	}

	protected closeDetails() {
		LocationsGrid.getInstance().setGridActiveItem(null)
		router.navigate(LocationsGrid.getInstance().getGridUrlRoute())
	}

	protected async openEditLocationDialog() {
		const { EditLocationDialog } = await import("@components/dialogs/EditLocationDialog.ts")
		const editLocationDialog = new EditLocationDialog()
		editLocationDialog.open()
	}

	protected async downloadPlanetAvatar(locationId: string, path: string) {
		await downloadFile({
			bucket: "avatars",
			id: locationId,
			filePath: path,
			downloadingSet: this.downloadingAvatarImages,
			onSuccess: (id, fileUrl) => {
				planetAvatarStore.set({ ...planetAvatarStore.get(), [id]: fileUrl })
				this.render()
			}
		})
	}

	protected async downloadLocationLandscape(locationId: string, path: string) {
		await downloadFile({
			bucket: "avatars",
			id: locationId,
			filePath: path,
			downloadingSet: this.downloadingHeroImages,
			onSuccess: (id, fileUrl) => {
				locationLandscapeStore.set({ ...locationLandscapeStore.get(), [id]: fileUrl })
				this.render()
			}
		})
	}

	protected toggleFavoriteLocation = () => {
		this.toggleFavorites("favLocation")
		RentalsSideNav.getInstance().initializeFavorites()
		RentalsSideNav.getInstance().render()
	}

	protected isLocationFavorite = () => {
		return this.isFavorite("favLocation")
	}

	headerTemplate() {
		return html`
			${HeaderSection({
				templateContent: html`
					<vaadin-button 
						@click=${this.closeDetails} 
						class="back" 
						theme="icon tertiary contrast">
						<vaadin-icon src="/arrow-left.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text="Back">
						</vaadin-tooltip>
					</vaadin-button>
					<h2>Location Details</h2>
					<vaadin-button
						@click=${this.toggleFavoriteLocation} 
						theme="icon tertiary contrast">
						<vaadin-icon 
							src=${this.isLocationFavorite() ? "/star-filled.svg" : "/star.svg"}>
						</vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text=${this.isLocationFavorite() ? "Remove from favorites" : "Add to favorites"}>
						</vaadin-tooltip>
					</vaadin-button>
					<vaadin-button 
						@click=${this.openEditLocationDialog}
						id="editLocationButton" 
						theme="icon tertiary contrast">
						<vaadin-icon src="/edit.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text="Edit location">
						</vaadin-tooltip>
					</vaadin-button>
					<vaadin-button 
						@click=${this.closeDetails} 
						class="close" 
						theme="icon tertiary contrast">
						<vaadin-icon src="/close.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text="Close">
						</vaadin-tooltip>
					</vaadin-button>
				`
			})}
		`
	}

	bodyTemplate() {
		const theme = setGravityTheme(this.data?.gravity!)
		const heroPlaceholder = "/hero_placeholder.jpg"
		
		const currentAvatarStore = planetAvatarStore.get()
		const planetAvatarUrl = currentAvatarStore[this.data?.id!]
		if (this.data?.planet_avatar && (planetAvatarUrl === undefined)) {
			this.downloadPlanetAvatar(this.data.id, this.data.planet_avatar)
		}

		const currentLocationLandscapeStore = locationLandscapeStore.get()
		const locationLandscapeUrl = currentLocationLandscapeStore[this.data?.id!]
		if (this.data?.location_landscape && (locationLandscapeUrl === undefined)) {
			this.downloadLocationLandscape(this.data.id, this.data.location_landscape)
		}

		return html`
			<vaadin-scroller theme="overflow-indicators" class="View-content">
				<div class="location-profile-view flex flex-col" style="--hero-image: url(${locationLandscapeUrl || heroPlaceholder});">
					<div class="flex hero mb-xl pt-xl">
						<vaadin-avatar
							.img=${planetAvatarUrl || nothing}
							theme="xlarge">
						</vaadin-avatar>
					</div>
					<div class="flex flex-col p-l items-start gap-m">
						<div class="flex flex-col">
							<h3 class="text-xl font-extrabold mb-m">${this.data?.name}</h3>
							<div class="text-secondary text-s">${this.data?.description}</div>
						</div>
					</div>
					<hr>
					<div class="flex flex-col p-l gap-m">
						<h4>Information</h4>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/clock.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Hours of operation</h5>
								<div class="text-secondary">${this.data?.hours_of_operation}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/users.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Employees</h5>
								<div class="text-secondary">${this.data?.employees}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/location.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Coordinates</h5>
								<div class="text-secondary">${this.data?.coordinates}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/gravity.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Gravity</h5>
								<vaadin-progress-bar
									.value=${this.data?.gravity}
									.max=${2.5} 
									theme=${theme}>
								</vaadin-progress-bar>
								<div class="text-xs text-secondary">${this.data?.gravity! * 100}% Earth's gravity</div>
							</div>
						</div>
					</div>
				</div>
			</vaadin-scroller>
		`
	}

}
