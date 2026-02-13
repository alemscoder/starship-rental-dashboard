import { html, nothing } from "lit-html"
import { editEmployeeSchema } from "@schema/employee.schema.ts"
import { EmployeesGrid } from "@components/grids/EmployeesGrid.ts"
import { ActionDialogBase } from "@base/dialogs/ActionDialogBase.ts"
import { EmployeeDetails } from "@components/panels/EmployeeDetails.ts"
import { profileAvatarStore, profileHeroStore } from "@store/fileUrl.store.ts"
import type { Button } from "@vaadin/button"
import type { Employee } from "../../types.ts"

/**
 * Represents a dialog for modifying an existing employee's details.
 * 
 * This class extends the EmployeeDialogBase to provide specific functionality
 * for editing and deleting employee records. It implements abstract methods from the
 * base class and adds additional behavior specific to the employee modification process.
 * 
 * @extends {ActionDialogBase<Employee>}
 */
export class EditEmployeeDialog extends ActionDialogBase<Employee> {

	constructor() {
		super("#editEmployeeButton")
		this.formController.setRenderCallback(() => this.render())
		this.formController.setValidationSchema(editEmployeeSchema)
		this.formController.errorValidationContainers = {
			profile_avatar: "#avatarValidationError",
			profile_hero: "#heroValidationError"
		}
	}

	protected getDialogId() {
		return "#editEmployee"
	}

	protected getDialogClass() {
		return "edit employee"
	}

	protected getActionButtonSelector() {
		return "vaadin-dialog-overlay.edit.employee #saveEditedEmployee"
	}

	protected getFormFieldNames(fieldType?: string): (keyof Employee)[] {
		if (fieldType === "file") {
			return ["profile_avatar", "profile_hero"]
		} else {
			return [
				"first_name", "last_name", "email", 
				"job_title", "phone", "role"
			]
		}
	}

	/**
	 * Retrieves the employee details from the `EmployeeDetails` component.
	 * @protected
	 * @returns The employee details.
	 */
	protected getEmployeeDetails() {
		return EmployeeDetails.getInstance().getDataByReference()
	}

	/**
	 * Retrieves the navigation path from the `EmployeesGrid` component.
	 *
	 * @returns The navigation path.
	 */
	protected getNavigatePath() {
		return EmployeesGrid.getInstance().getGridUrlRoute()
	}

	/**
	 * Retrieves the profile avatar URL for a given employee ID.
	 *
	 * @param employeeId - The ID of the employee.
	 * @returns The profile avatar URL.
	 */
	protected getProfileAvatarUrlById(employeeId: string) {
		return profileAvatarStore.get()[employeeId]
	}

	/**
	 * Retrieves the profile hero URL for a given employee ID.
	 *
	 * @param employeeId - The ID of the employee.
	 * @returns The profile hero URL.
	 */
	protected getProfileHeroUrlById(employeeId: string) {
		return profileHeroStore.get()[employeeId]
	}

	protected handleSubmitRecord = async (event: SubmitEvent) => {
		event.preventDefault()
		const form = event.currentTarget as HTMLFormElement
		const saveButton = this.formController.getActionButton(
			this.getActionButtonSelector(),
		)
		this.formController.handleButtonState(true, saveButton)
		const formData = new FormData()
		const employeeData = this.formController.recordsFormData.get()
		const formFieldNames = this.getFormFieldNames()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "employee",
			type: "edit",
		})
		const onSuccess = () => this.closeDialog()
		const employeeId = this.getEmployeeDetails().id
		formData.append("id", employeeId)
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
		this.formController.handleFileField(
			formData,
			"profile_hero",
			employeeData.profile_hero!,
		)
		await this.formController.processFormSubmission(
			formData,
			apiEndpoint,
			form,
			saveButton,
			onSuccess,
		)
	}

	protected handleDeleteRecord = async (event: MouseEvent) => {
		const deleteButton = event.currentTarget as Button
		const formData = new FormData()
		const employeeDetails = this.getEmployeeDetails()
		const formFieldNames = this.getFormFieldNames("file")
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "employee", 
			type: "delete"
		})
		const navigatePath = this.getNavigatePath()
		const onSuccess = () => this.closeDialog()
		const result = await this.confirmDelete(
			"Delete employee",
			"Are you sure you want to delete this employee? This action cannot be undone."
		)
		if (result === "confirm") {
			this.formController.handleButtonState(true, deleteButton)
			const deleteRequest = this.formController.prepareDeleteFormData(
				formData, 
				employeeDetails, 
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

	/** 
	 * Define the select items for the `vaadin-select` element.
	 * @protected
	 * @returns An array of selectable items.
	 */
	protected selectItems = () => {
		return [
			{ label: "Admin", value: "admin" },
			{ label: "Manager", value: "manager" },
			{ label: "Staff", value: "staff" }
		]
	}

	protected renderHeader = () => html`
		<h2 class="pt-s pb-s text-l font-bold flex-auto">
			Edit employee details
		</h2>
	`

	protected renderDialog = () => {
		const loggedInUserRole = this.loggedInUserData?.role
		const employeeDetails = this.getEmployeeDetails()
		const profileAvatarUrl = this.getProfileAvatarUrlById(employeeDetails.id)
		const profileHeroUrl = this.getProfileHeroUrlById(employeeDetails.id)
		return html`
			<vaadin-horizontal-layout theme="padding">
				<form 
					@submit=${this.handleSubmitRecord} 
					class="flex flex-wrap gap-x-m gap-y-m">
					${this.formImagesTemplate({
						formType: "edit",
						recordDetails: employeeDetails,
						avatar: { fieldName: "profile_avatar", imageUrl: profileAvatarUrl },
						hero: { fieldName: "profile_hero", imageUrl: profileHeroUrl }
					})}
					<vaadin-text-field
						@input=${this.handleFieldChange}
						.value=${employeeDetails.first_name}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="first_name" 
						label="First name">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${employeeDetails.last_name}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="last_name" 
						label="Last name">
					</vaadin-text-field>
					<vaadin-email-field
						@input=${this.handleFieldChange} 
						.value=${employeeDetails.email}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="email" 
						label="Email">
					</vaadin-email-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${employeeDetails.job_title}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="job_title" 
						label="Job title">
					</vaadin-text-field>
					<vaadin-text-field
						@input=${this.handleFieldChange} 
						.value=${employeeDetails.phone}
						.required=${true}
						.manualValidation=${true}
						class="flex-auto" 
						name="phone" 
						label="Phone">
					</vaadin-text-field>
					${loggedInUserRole === "admin"
						? html`
							<vaadin-select
								@change=${this.handleFieldChange} 
								.value=${employeeDetails.role} 
								.items=${this.selectItems()}
								.required=${true}
								.manualValidation=${true}
								class="flex-auto"
								name="role" 
								label="Role">
							</vaadin-select>
						`
						: nothing
					}
					${this.formActionButtonsTemplate({
						formType: "edit", 
						submitButtonId: "saveEditedEmployee"
					})}
				</form>
			</vaadin-horizontal-layout>
		`
	}

}
