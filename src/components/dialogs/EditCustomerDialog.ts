import { html } from "lit-html"
import { customerSchema } from "@schema/customer.schema.ts"
import { CustomersGrid } from "@components/grids/CustomersGrid.ts"
import { ActionDialogBase } from "@base/dialogs/ActionDialogBase.ts"
import { CustomerDetails } from "@components/panels/CustomerDetails.ts"
import type { Button } from "@vaadin/button"
import type { Customer } from "../../types.ts"

export class EditCustomerDialog extends ActionDialogBase<Customer> {

	constructor() {
		super("#editCustomerButton")
		this.formController.setRenderCallback(() => this.render())
		this.formController.setValidationSchema(customerSchema)
	}

	protected getDialogId() {
		return "#editCustomer"
	}

	protected getDialogClass() {
		return "edit customer"
	}

	protected getActionButtonSelector() {
		return "vaadin-dialog-overlay.edit.customer #saveEditedCustomer"
	}

	protected getFormFieldNames(fieldType?: string): (keyof Customer)[] {
		return [
			"first_name", "last_name", "nationality", "language", "date_of_birth", 
			"age", "driver_license", "email", "phone", "address"
		]
	}

	protected getCustomerDetails() {
		return CustomerDetails.getInstance().getDataByReference()
	}

	protected getNavigatePath() {
		return CustomersGrid.getInstance().getGridUrlRoute()
	}

	protected handleSubmitRecord = async (event: SubmitEvent) => {
		event.preventDefault()
		const form = event.currentTarget as HTMLFormElement
		const saveButton = this.formController.getActionButton(
			this.getActionButtonSelector()
		)
		this.formController.handleButtonState(true, saveButton)
		const formData = new FormData()
		const customerData = this.formController.recordsFormData.get()
		const formFieldNames = this.getFormFieldNames()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "customer", 
			type: "edit"
		})
		const onSuccess = () => this.closeDialog()
		const customerId = this.getCustomerDetails().id
		formData.append("id", customerId)
		this.formController.appendFormFields(
			formData, 
			customerData, 
			formFieldNames
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
		const customerDetails = this.getCustomerDetails()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "customer", 
			type: "delete"
		})
		const navigatePath = this.getNavigatePath()
		const onSuccess = () => this.closeDialog()
		const result = await this.confirmDelete(
			"Delete customer",
			"Are you sure you want to delete this customer? This action cannot be undone."
		)
		if (result === "confirm") {
			this.formController.handleButtonState(true, deleteButton)
			const deleteRequest = this.formController.prepareDeleteFormData(
				formData, 
				customerDetails
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
			Edit customer details
		</h2>
	`

	protected renderDialog = () => {
		const customerDetails = this.getCustomerDetails()
		return html`
			<vaadin-horizontal-layout theme="padding">
				<form 
					@submit=${this.handleSubmitRecord} 
					class="flex flex-wrap gap-x-m gap-y-m">
					<vaadin-text-field
						@input=${this.handleFieldChange}
						.value=${customerDetails.first_name}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="first_name" 
						label="First name">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${customerDetails.last_name}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="last_name" 
						label="Last name">
					</vaadin-text-field>
					<vaadin-email-field
						@input=${this.handleFieldChange} 
						.value=${customerDetails.email}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="email" 
						label="Email">
					</vaadin-email-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${customerDetails.phone}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="phone" 
						label="Phone">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${customerDetails.nationality}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="nationality" 
						label="Nationality">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${customerDetails.language}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="language" 
						label="Language">
					</vaadin-text-field>
					<vaadin-date-picker
						@change=${this.handleFieldChange}
						.value=${customerDetails.date_of_birth}
						.required=${true}
						.manualValidation=${true}
						auto-open-disabled
						class="flex-auto" 
						name="date_of_birth" 
						label="Date of birth">
					</vaadin-date-picker>
					<vaadin-number-field
						@input=${this.handleFieldChange} 
						.value=${customerDetails.age}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="age" 
						label="Age">
					</vaadin-number-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${customerDetails.driver_license}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="driver_license" 
						label="Driver license">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${customerDetails.address}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="address" 
						label="Address">
					</vaadin-text-field>
					${this.formActionButtonsTemplate({
						formType: "edit", 
						submitButtonId: "saveEditedCustomer"
					})}
				</form>
			</vaadin-horizontal-layout>
		`
	}

}
