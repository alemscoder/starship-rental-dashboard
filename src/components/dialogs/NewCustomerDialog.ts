import { html } from "lit-html"
import { customerSchema } from "@schema/customer.schema.ts"
import { ActionDialogBase } from "@base/dialogs/ActionDialogBase.ts"
import type { Customers } from "../../types.ts"

export class NewCustomerDialog extends ActionDialogBase<Customers> {

	constructor() {
		super("#rentalsMenuBar")
		this.formController.setRenderCallback(() => this.render())
		this.formController.setValidationSchema(customerSchema)
	}

	protected getDialogId() {
		return "#newCustomer"
	}

	protected getDialogClass() {
		return "new customer"
	}

	protected getActionButtonSelector() {
		return "vaadin-dialog-overlay.new.customer #submitNewCustomer"
	}

	protected getFormFieldNames(): (keyof Customers)[] {
		return [
			"first_name", "last_name", "nationality", "language", "date_of_birth", 
			"age", "driver_license", "email", "phone", "address"
		]
	}
	
	protected async handleSubmitRecord(event: SubmitEvent) {
		event.preventDefault()
		const form = event.currentTarget as HTMLFormElement
		const submitButton = this.formController.getActionButton(
			this.getActionButtonSelector(),
		)
		this.formController.handleDisabledButton(true, submitButton)
		const formData = new FormData()
		const customerData = this.formController.recordsFormData.get()
		const formFieldNames = this.getFormFieldNames()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "customer",
			type: "add",
		})
		const onSuccess = () => this.closeDialog()
		this.formController.appendFormFields(
			formData, 
			customerData, 
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

	protected renderHeader = () => html`
		<h2 class="text-l font-bold flex-auto">
			Add new customer
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
		<vaadin-vertical-layout theme="spacing">
			<form 
				@submit=${this.handleSubmitRecord} 
				class="mt-m flex flex-col gap-s">
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="first_name" 
					label="First name">
				</vaadin-text-field>
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="last_name" 
					label="Last name">
				</vaadin-text-field>
				<vaadin-email-field
					@input=${this.handleFieldChange} 
					.required=${true}
					.manualValidation=${true}
					name="email" 
					label="Email">
				</vaadin-email-field>
				<vaadin-text-field
					@input=${this.handleFieldChange} 
					.required=${true}
					.manualValidation=${true}
					name="phone" 
					label="Phone">
				</vaadin-text-field>
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="nationality" 
					label="Nationality">
				</vaadin-text-field>
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true} 
					name="language" 
					label="Language">
				</vaadin-text-field>
				<vaadin-date-picker
					@change=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					auto-open-disabled 
					name="date_of_birth" 
					label="Date of birth">
				</vaadin-date-picker>
				<vaadin-number-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true} 
					name="age" 
					label="Age">
				</vaadin-number-field>
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true} 
					name="driver_license" 
					label="Driver license">
				</vaadin-text-field>
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="address" 
					label="Address">
				</vaadin-text-field>
				${this.formActionButtonsTemplate({
					formType: "add", 
					submitButtonId: "submitNewCustomer"
				})}
			</form>
		</vaadin-vertical-layout>
	`

}
