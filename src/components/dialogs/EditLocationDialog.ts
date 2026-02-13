import { html } from "lit-html"
import { locationSchema } from "@schema/location.schema.ts"
import { LocationsGrid } from "@components/grids/LocationsGrid.ts"
import { ActionDialogBase } from "@base/dialogs/ActionDialogBase.ts"
import { LocationDetails } from "@components/panels/LocationDetails.ts"
import { planetAvatarStore, locationLandscapeStore } from "@store/fileUrl.store.ts"
import type { Button } from "@vaadin/button"
import type { Location } from "../../types.ts"

export class EditLocationDialog extends ActionDialogBase<Location> {

	constructor() {
		super("#editLocationButton")
		this.formController.setRenderCallback(() => this.render())
		this.formController.setValidationSchema(locationSchema)
		this.formController.errorValidationContainers = {
			planet_avatar: "#avatarValidationError",
			location_landscape: "#heroValidationError"
		}
	}

	protected getDialogId() {
		return "#editLocation"
	}

	protected getDialogClass() {
		return "edit location"
	}

	protected getActionButtonSelector() {
		return "vaadin-dialog-overlay.edit.location #saveEditedLocation"
	}

	protected getFormFieldNames(fieldType?: string): (keyof Location)[] {
		if (fieldType === "file") {
			return ["planet_avatar", "location_landscape"]
		} else {
			return [
				"name", "description", "coordinates", 
				"employees", "hours_of_operation", "gravity"
			]
		}
	}

	protected getLocationDetails() {
		return LocationDetails.getInstance().getDataByReference()
	}

	protected getNavigatePath() {
		return LocationsGrid.getInstance().getGridUrlRoute()
	}

	protected getPlanetAvatarUrlById(locationId: string) {
		return planetAvatarStore.get()[locationId]
	}

	protected getLocationLandscapeUrlById(locationId: string) {
		return locationLandscapeStore.get()[locationId]
	}

	protected handleSubmitRecord = async (event: SubmitEvent) => {
		event.preventDefault()
		const form = event.currentTarget as HTMLFormElement
		const saveButton = this.formController.getActionButton(
			this.getActionButtonSelector()
		)
		this.formController.handleButtonState(true, saveButton)
		const formData = new FormData()
		const locationData = this.formController.recordsFormData.get()
		const formFieldNames = this.getFormFieldNames()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "location", 
			type: "edit"
		})
		const onSuccess = () => this.closeDialog()
		const locationId = this.getLocationDetails().id
		formData.append("id", locationId)
		this.formController.appendFormFields(
			formData, 
			locationData, 
			formFieldNames
		)
		this.formController.handleFileField(
			formData, 
			"planet_avatar", 
			locationData.planet_avatar!
		)
		this.formController.handleFileField(
			formData, 
			"location_landscape", 
			locationData.location_landscape!
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
		const locationDetails = this.getLocationDetails()
		const formFieldNames = this.getFormFieldNames("file")
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "location", 
			type: "delete"
		})
		const navigatePath = this.getNavigatePath()
		const onSuccess = () => this.closeDialog()
		const result = await this.confirmDelete(
			"Delete location",
			"Are you sure you want to delete this location? This action cannot be undone."
		)
		if (result === "confirm") {
			this.formController.handleButtonState(true, deleteButton)
			const deleteRequest = this.formController.prepareDeleteFormData(
				formData, 
				locationDetails, 
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

	protected renderHeader = () => html`
		<h2 class="pt-s pb-s text-l font-bold flex-auto">
			Edit location details
		</h2>
	`

	protected renderDialog = () => {
		const locationDetails = this.getLocationDetails()
		const planetAvatarUrl = this.getPlanetAvatarUrlById(locationDetails.id)
		const locationLandscapeUrl = this.getLocationLandscapeUrlById(locationDetails.id)
		return html`
			<vaadin-horizontal-layout theme="padding">
				<form 
					@submit=${this.handleSubmitRecord} 
					class="flex flex-wrap gap-x-m gap-y-m">
					${this.formImagesTemplate({
						formType: "edit",
						recordDetails: locationDetails,
						avatar: { fieldName: "planet_avatar", imageUrl: planetAvatarUrl },
						hero: { fieldName: "location_landscape", imageUrl: locationLandscapeUrl }
					})}
					<vaadin-text-field
						@input=${this.handleFieldChange}
						.value=${locationDetails.name}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="name" 
						label="Name">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${locationDetails.description}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="description" 
						label="Description">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${locationDetails.coordinates}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="coordinates" 
						label="Coordinates">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${locationDetails.hours_of_operation}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="hours_of_operation" 
						label="Hours of operation">
					</vaadin-text-field>
					<vaadin-number-field
						@input=${this.handleFieldChange} 
						.value=${locationDetails.employees}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="employees" 
						label="Employees">
					</vaadin-number-field>
					<vaadin-number-field
						@input=${this.handleFieldChange} 
						.value=${locationDetails.gravity}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="gravity" 
						label="Gravity">
					</vaadin-number-field>
					${this.formActionButtonsTemplate({
						formType: "edit", 
						submitButtonId: "saveEditedLocation"
					})}
				</form>
			</vaadin-horizontal-layout>
		`
	}

}
