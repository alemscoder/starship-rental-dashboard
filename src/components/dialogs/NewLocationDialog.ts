import { html } from "lit-html"
import { locationSchema } from "@schema/location.schema.ts"
import { ActionDialogBase } from "@base/dialogs/ActionDialogBase.ts"
import type { Location } from "../../types.ts"

export class NewLocationDialog extends ActionDialogBase<Location> {

	constructor() {
		super("#rentalsMenuBar")
		this.formController.setRenderCallback(() => this.render())
		this.formController.setValidationSchema(locationSchema)
		this.formController.errorValidationContainers = {
			planet_avatar: "#avatarValidationError"
		}
	}

	protected getDialogId() {
		return "#newLocation"
	}

	protected getDialogClass() {
		return "new location"
	}

	protected getActionButtonSelector() {
		return "vaadin-dialog-overlay.new.location #submitNewLocation"
	}

	protected getFormFieldNames(fieldType?: string): (keyof Location)[] {
		if (fieldType === "file") {
			return ["planet_avatar"]
		} else {
			return [
				"name", "description", "coordinates", 
				"employees", "hours_of_operation", "gravity"
			]
		}
	}
	
	protected handleSubmitRecord = async (event: SubmitEvent) => {
		event.preventDefault()
		const form = event.currentTarget as HTMLFormElement
		const submitButton = this.formController.getActionButton(
			this.getActionButtonSelector(),
		)
		this.formController.handleButtonState(true, submitButton)
		const formData = new FormData()
		const locationData = this.formController.recordsFormData.get()
		const formFieldNames = this.getFormFieldNames()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "location",
			type: "add",
		})
		const onSuccess = () => this.closeDialog()
		this.formController.appendFormFields(
			formData, 
			locationData, 
			formFieldNames
		)
		this.formController.handleFileField(
			formData,
			"planet_avatar",
			locationData.planet_avatar!,
		)
		await this.formController.processFormSubmission(
			formData,
			apiEndpoint,
			form,
			submitButton,
			onSuccess,
		)
	}

	protected renderHeader = () => html`
		<h2 class="text-l font-bold flex-auto">
			Add new location
		</h2>
		<vaadin-button 
			@click=${this.close} 
			theme="icon tertiary contrast">
			<vaadin-icon src="/close.svg"></vaadin-icon>
			<vaadin-tooltip
				slot="tooltip" 
				text="Close">
			</vaadin-tooltip>
		</vaadin-button>
	`

	protected renderDialog = () => html`
		<vaadin-vertical-layout theme="padding" class="pt-0 items-stretch">
			<form 
				@submit=${this.handleSubmitRecord} 
				class="mt-m flex flex-col gap-s">
				${this.formImagesTemplate({
					formType: "add",
					avatar: { fieldName: "planet_avatar" }
				})}
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="name" 
					label="Name">
				</vaadin-text-field>
				<vaadin-text-field
					@input=${this.handleFieldChange} 
					.required=${true}
					.manualValidation=${true}
					name="description" 
					label="Description">
				</vaadin-text-field>
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true} 
					name="coordinates" 
					label="Coordinates">
				</vaadin-text-field>
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="hours_of_operation" 
					label="Hours of operation">
				</vaadin-text-field>
				<vaadin-number-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="employees" 
					label="Employees">
				</vaadin-number-field>
				<vaadin-number-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="gravity" 
					label="Gravity">
				</vaadin-number-field>
				${this.formActionButtonsTemplate({
					formType: "add", 
					submitButtonId: "submitNewLocation"
				})}
			</form>
		</vaadin-vertical-layout>
	`

}
