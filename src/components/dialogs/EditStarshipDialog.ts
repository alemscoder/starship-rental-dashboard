import { html } from "lit-html"
import { starshipSchema } from "@schema/starship.schema.ts"
import { starshipHeroStore } from "@store/fileUrl.store.ts"
import { StarshipsGrid } from "@components/grids/StarshipsGrid.ts"
import { ActionDialogBase } from "@base/dialogs/ActionDialogBase.ts"
import { StarshipDetails } from "@components/panels/StarshipDetails.ts"
import type { Button } from "@vaadin/button"
import type { Starship } from "../../types.ts"

export class EditStarshipDialog extends ActionDialogBase<Starship> {

	constructor() {
		super("#editStarshipButton")
		this.formController.setRenderCallback(() => this.render())
		this.formController.setValidationSchema(starshipSchema)
		this.formController.errorValidationContainers = {
			hero_image: "#heroValidationError"
		}
	}

	protected getDialogId() {
		return "#editStarship"
	}

	protected getDialogClass() {
		return "edit starship"
	}

	protected getActionButtonSelector() {
		return "vaadin-dialog-overlay.edit.starship #saveEditedStarship"
	}

	protected getFormFieldNames(fieldType?: string): (keyof Starship)[] {
		if (fieldType === "file") {
			return ["hero_image"]
		} else {
			return [
				"make", "model", "description", "year", "fuel_type",
				"license_plate", "mileage", "status"
			]
		}
	}

	protected getStarshipDetails() {
		return StarshipDetails.getInstance().getDataByReference()
	}

	protected getNavigatePath() {
		return StarshipsGrid.getInstance().getGridUrlRoute()
	}

	protected getHeroImageUrlById(starshipId: string) {
		return starshipHeroStore.get()[starshipId]
	}

	protected handleSubmitRecord = async (event: SubmitEvent) => {
		event.preventDefault()
		const form = event.currentTarget as HTMLFormElement
		const saveButton = this.formController.getActionButton(
			this.getActionButtonSelector()
		)
		this.formController.handleButtonState(true, saveButton)
		const formData = new FormData()
		const starshipData = this.formController.recordsFormData.get()
		const formFieldNames = this.getFormFieldNames()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "starship", 
			type: "edit"
		})
		const onSuccess = () => this.closeDialog()
		const starshipId = this.getStarshipDetails().id
		formData.append("id", starshipId)
		this.formController.appendFormFields(
			formData, 
			starshipData, 
			formFieldNames
		)
		this.formController.handleFileField(
			formData, 
			"hero_image", 
			starshipData.hero_image!
		)
		await this.formController.processFormSubmission(
			formData, 
			apiEndpoint, 
			form, 
			saveButton, 
			onSuccess
		)
	}

	protected handleDeleteRecord = async (event: MouseEvent) => {
		const deleteButton = event.currentTarget as Button
		const formData = new FormData()
		const starshipDetails = this.getStarshipDetails()
		const formFieldNames = this.getFormFieldNames("file")
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "starship", 
			type: "delete"
		})
		const navigatePath = this.getNavigatePath()
		const onSuccess = () => this.closeDialog()
		const result = await this.confirmDelete(
			"Delete starship",
			"Are you sure you want to delete this starship? This action cannot be undone."
		)
		if (result === "confirm") {
			this.formController.handleButtonState(true, deleteButton)
			const deleteRequest = this.formController.prepareDeleteFormData(
				formData, 
				starshipDetails, 
				formFieldNames
			)
			await this.formController.processDeleteRequest(
				deleteRequest,
				apiEndpoint,
				deleteButton,
				navigatePath,
				onSuccess
			)
		}
	}

	protected selectItems = () => {
		return [
			{ label: "Available", value: "available" },
			{ label: "Maintenance", value: "maintenance" },
			{ label: "Rented", value: "rented" }
		]
	}

	protected renderHeader = () => html`
		<h2 class="pt-s pb-s text-l font-bold flex-auto">
			Edit starship details
		</h2>
	`

	protected renderDialog = () => {
		const starshipDetails = this.getStarshipDetails()
		const heroImageUrl = this.getHeroImageUrlById(starshipDetails.id)
		return html`
			<vaadin-horizontal-layout theme="padding">
				<form 
					@submit=${this.handleSubmitRecord} 
					class="flex flex-wrap gap-x-m gap-y-m">
					${this.formImagesTemplate({
						formType: "edit",
						recordDetails: starshipDetails,
						hero: { fieldName: "hero_image", imageUrl: heroImageUrl }
					})}
					<vaadin-text-field
						@input=${this.handleFieldChange}
						.value=${starshipDetails.make}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="make" 
						label="Make">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange}
						.value=${starshipDetails.model}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="model" 
						label="Model">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${starshipDetails.description}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="description" 
						label="Description">
					</vaadin-text-field>
					<vaadin-number-field
						@input=${this.handleFieldChange} 
						.value=${starshipDetails.year}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="year" 
						label="Year">
					</vaadin-number-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${starshipDetails.fuel_type}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="fuel_type" 
						label="Fuel type">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${starshipDetails.license_plate}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="license_plate" 
						label="License plate">
					</vaadin-text-field>
					<vaadin-number-field
						@input=${this.handleFieldChange} 
						.value=${starshipDetails.mileage}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="mileage" 
						label="Mileage">
					</vaadin-number-field>
					<vaadin-select
						@change=${this.handleFieldChange} 
						.value=${starshipDetails.status} 
						.items=${this.selectItems()}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto"
						name="status" 
						label="Status">
					</vaadin-select>
					${this.formActionButtonsTemplate({
						formType: "edit", 
						submitButtonId: "saveEditedStarship"
					})}
				</form>
			</vaadin-horizontal-layout>
		`
	}

}
