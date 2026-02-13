import { html } from "lit-html"
import { starshipSchema } from "@schema/starship.schema.ts"
import { ActionDialogBase } from "@base/dialogs/ActionDialogBase.ts"
import type { Starship } from "../../types.ts"

export class NewStarshipDialog extends ActionDialogBase<Starship> {

	constructor() {
		super("#newStarshipButton")
		this.formController.setRenderCallback(() => this.render())
		this.formController.setValidationSchema(starshipSchema)
	}

	protected getDialogId() {
		return "#newStarship"
	}

	protected getDialogClass() {
		return "new starship"
	}

	protected getActionButtonSelector() {
		return "vaadin-dialog-overlay.new.starship #submitNewStarship"
	}

	protected getFormFieldNames(): (keyof Starship)[] {
		return [
			"make", "model", "description", "year", "fuel_type",
			"license_plate", "mileage", "status"
		]
	}
	
	protected handleSubmitRecord = async (event: SubmitEvent) => {
		event.preventDefault()
		const form = event.currentTarget as HTMLFormElement
		const submitButton = this.formController.getActionButton(
			this.getActionButtonSelector(),
		)
		this.formController.handleButtonState(true, submitButton)
		const formData = new FormData()
		const starshipData = this.formController.recordsFormData.get()
		const formFieldNames = this.getFormFieldNames()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "starship",
			type: "add",
		})
		const onSuccess = () => this.closeDialog()
		this.formController.appendFormFields(
			formData, 
			starshipData, 
			formFieldNames
		)
		await this.formController.processFormSubmission(
			formData,
			apiEndpoint,
			form,
			submitButton,
			onSuccess,
		)
	}

	protected selectItems = () => {
		return [
			{ label: "Available", value: "available" },
			{ label: "Maintenance", value: "maintenance" },
			{ label: "Rented", value: "rented" }
		]
	}

	protected renderHeader = () => html`
		<h2 class="text-l font-bold flex-auto">
			Add new starship
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
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="make" 
					label="Make">
				</vaadin-text-field>
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="model" 
					label="Model">
				</vaadin-text-field>
				<vaadin-text-field
					@input=${this.handleFieldChange} 
					.required=${true}
					.manualValidation=${true}
					name="description" 
					label="Description">
				</vaadin-text-field>
				<vaadin-number-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="year" 
					label="Year">
				</vaadin-number-field>
				<vaadin-text-field
					@input=${this.handleFieldChange} 
					.required=${true}
					.manualValidation=${true}
					name="fuel_type" 
					label="Fuel type">
				</vaadin-text-field>
				<vaadin-text-field
					@input=${this.handleFieldChange} 
					.required=${true}
					.manualValidation=${true}
					name="license_plate" 
					label="License plate">
				</vaadin-text-field>
				<vaadin-number-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="mileage" 
					label="Mileage">
				</vaadin-number-field>
				<vaadin-select
					@change=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true} 
					.items=${this.selectItems()}
					name="status" 
					label="Status">
				</vaadin-select>
				${this.formActionButtonsTemplate({
					formType: "add", 
					submitButtonId: "submitNewStarship"
				})}
			</form>
		</vaadin-vertical-layout>
	`

}
