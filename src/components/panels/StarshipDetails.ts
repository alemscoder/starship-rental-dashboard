import router from "@router/router.ts"
import { html, nothing } from "lit-html"
import { Badge } from "@components/Badge.ts"
import { downloadFile } from "@lib/utils.client.ts"
import { processStatusBadge } from "@utils/utils.ts"
import { DetailsBase } from "@base/panel/DetailsBase.ts"
import { starshipsStore } from "@store/gridData.store.ts"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { starshipHeroStore } from "@store/fileUrl.store.ts"
import { StarshipsGrid } from "@components/grids/StarshipsGrid.ts"
import type { Starships } from "../../types.ts"

export class StarshipDetails extends DetailsBase<Starships> {

	static #instance: StarshipDetails

	constructor() {
		super(".starships-view")
		this.initialize()
		if (!!StarshipDetails.#instance) {
			return StarshipDetails.#instance
		}
		StarshipDetails.#instance = this
	}

	static getInstance() {
		if (!StarshipDetails.#instance) {
			new StarshipDetails()
		}
		return StarshipDetails.#instance
	}

	protected async initialize() {
		await StarshipsGrid.getInstance().waitForInitialization()
		this.data = this.getDataByReference()
		this.render()
	}

	protected getRecordsStore() {
		return starshipsStore 
	}
	
	public updateDetails(StarshipDetails: Starships) {
		this.data = StarshipDetails
		this.render()
	}

	protected closeDetails() {
		StarshipsGrid.getInstance().setGridActiveItem(null)
		router.navigate(StarshipsGrid.getInstance().getGridUrlRoute())
	}

	protected async openEditStarshipDialog() {
		const { EditStarshipDialog } = await import("@components/dialogs/EditStarshipDialog.ts")
		const editStarshipDialog = new EditStarshipDialog()
		editStarshipDialog.open()
	}

	protected async downloadHeroImage(starshipId: string, path: string) {
		await downloadFile({
			bucket: "avatars",
			id: starshipId,
			filePath: path,
			downloadingSet: this.downloadingAvatarImages,
			onSuccess: (id, fileUrl) => {
				starshipHeroStore.set({ ...starshipHeroStore.get(), [id]: fileUrl })
				this.render()
			}
		})
	}

	headerTemplate() {
		const loggedInUserRole = this.loggedInUserData?.role
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
					<h2>Starship Details</h2>
					${
						loggedInUserRole === "admin" || loggedInUserRole === "manager"
						? html`
							<vaadin-button
								@click=${this.openEditStarshipDialog} 
								id="editStarshipButton" 
								theme="icon tertiary contrast">
								<vaadin-icon src="/edit.svg"></vaadin-icon>
								<vaadin-tooltip
									slot="tooltip" 
									text="Edit starship">
								</vaadin-tooltip>
							</vaadin-button>
						`
						: nothing
					}
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
		const { themeBadge, statusText } = processStatusBadge(this.data?.status)
		const heroPlaceholder = "/hero_placeholder.jpg"
		const currentHeroImageStore = starshipHeroStore.get()
		const heroImageUrl = currentHeroImageStore[this.data?.id!]
		if (this.data?.hero_image && (heroImageUrl === undefined)) {
			this.downloadHeroImage(this.data.id, this.data.hero_image)
		}
		return html`
			<vaadin-scroller theme="overflow-indicators" class="View-content">
				<div class="starship-profile-view flex flex-col" style="--hero-image: url(${heroImageUrl || heroPlaceholder});">
					<div class="flex hero" style="height: 216px">
					</div>
					<div class="flex flex-col p-l items-start gap-m">
						<div class="flex flex-col">
							<h3 class="text-xl font-extrabold mb-m">${this.data?.make}</h3>
							<div class="text-secondary text-s">${this.data?.description}</div>
						</div>
						${Badge({ 
							text: statusText, 
							theme: themeBadge
						})}
					</div>
					<hr>
					<div class="flex flex-col p-l gap-m">
						<h4>Specification</h4>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/engine.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Model</h5>
								<div class="text-secondary">${this.data?.model}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/calendar.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Year</h5>
								<div class="text-secondary">${this.data?.year}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/fuel-type.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Fuel type</h5>
								<div class="text-secondary">${this.data?.fuel_type}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/license_plate.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">License plate</h5>
								<div class="text-secondary">${this.data?.license_plate}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/mileage.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Mileage</h5>
								<div class="text-secondary">${this.data?.mileage}</div>
							</div>
						</div>
					</div>
				</div>
			</vaadin-scroller>
		`
	}

}
