import { html } from "lit-html"
import { newEmployeeSchema } from "@schema/employee.schema.ts"
import { ActionDialogBase } from "@base/dialogs/ActionDialogBase.ts"
import type { Employees } from "../../types.ts"

export class NewEmployeeDialog extends ActionDialogBase<Employees> {

	constructor() {
		super("#newEmployeeButton")
		this.formController.setRenderCallback(() => this.render())
		this.formController.setValidationSchema(newEmployeeSchema)
		this.formController.errorValidationContainers = {
			profile_avatar: "#avatarValidationError"
		}
	}

	protected getDialogId() {
		return "#newEmployee"
	}

	protected getDialogClass() {
		return "new employee"
	}

	protected getActionButtonSelector() {
		return "vaadin-dialog-overlay.new.employee #submitNewEmployee"
	}

	protected getFormFieldNames(fieldType?: string): (keyof Employees)[] {
		if (fieldType === "file") {
			return ["profile_avatar"]
		} else {
			return [
				"first_name", "last_name", "email", "job_title",
				"phone", "role", "password", "confirm_password"
			]
		}
	}
	
	protected async handleSubmitRecord(event: SubmitEvent) {
		event.preventDefault()
		const form = event.currentTarget as HTMLFormElement
		const submitButton = this.formController.getActionButton(
			this.getActionButtonSelector(),
		)
		this.formController.handleDisabledButton(true, submitButton)
		const formData = new FormData()
		const employeeData = this.formController.recordsFormData.get()
		const formFieldNames = this.getFormFieldNames()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "employee",
			type: "add",
		})
		const onSuccess = () => this.closeDialog()
		this.formController.appendFormFields(
			formData, 
			employeeData, 
			formFieldNames
		)
		this.formController.handleFileField(
			formData,
			"profile_avatar",
			employeeData.profile_avatar!,
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
			{ label: "Admin", value: "admin" },
			{ label: "Manager", value: "manager" },
			{ label: "Staff", value: "staff" }
		]
	}

	protected renderHeader = () => html`
		<h2 class="text-l font-bold flex-auto">
			Add new employee
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
				${this.formImagesTemplate({
					formType: "add",
					avatar: { fieldName: "profile_avatar" }
				})}
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
					label="Email address">
				</vaadin-email-field>
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true} 
					name="job_title" 
					label="Job title">
				</vaadin-text-field>
				<vaadin-text-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true}
					name="phone" 
					label="Phone">
				</vaadin-text-field>
				<vaadin-select
					@change=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true} 
					.items=${this.selectItems()}
					name="role" 
					label="Role">
				</vaadin-select>
				<vaadin-password-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true} 
					name="password" 
					label="Password">
				</vaadin-password-field>
				<vaadin-password-field
					@input=${this.handleFieldChange}
					.required=${true}
					.manualValidation=${true} 
					name="confirm_password" 
					label="Confirm password">
				</vaadin-password-field>
				${this.formActionButtonsTemplate({
					formType: "add", 
					submitButtonId: "submitNewEmployee"
				})}
			</form>
		</vaadin-vertical-layout>
	`

}
