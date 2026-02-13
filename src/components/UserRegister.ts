import { html } from "lit-html"
import { Toast } from "@components/Toast.ts"
import { Forms } from "@controllers/forms.ts"
import { newUser } from "@schema/employee.schema.ts"
import { actions, isInputError } from "astro:actions"
import { observeAndRender } from "@utils/observe-and-render.ts"
import type { ValidationErrorResponse } from "../types.ts"

type NewUser = {
	first_name: string
	last_name: string
	email: string
	password: string
	confirm_password: string
}

const formController = new Forms<NewUser>()

export function UserRegister() {

	const disabledUserRegister = true

	const backToSignInForm = () => {
		const signInPanel = document.querySelector<HTMLDivElement>("#signInPanel")
		const registerPanel = document.querySelector<HTMLDivElement>("#registerPanel")
		if (signInPanel) signInPanel.dataset.active = "true"
		if (registerPanel) registerPanel.dataset.active = "false"
	}

	const handleSubmit = async (event: SubmitEvent) => {
		if (disabledUserRegister) {
			event.preventDefault()
			return Toast({ message: "User registration temporarily disabled." })
		} else {
			event.preventDefault()
			const form = event.currentTarget as HTMLFormElement
			const submitButton = formController.getActionButton("#registerPanel #userRegisterButton")
			formController.handleButtonState(true, submitButton)
			const formData = new FormData(form)
			const formEntries = Object.fromEntries(formData.entries()) as NewUser
			const clientValidationResponse = formController.validateFormData(formEntries)
			if (clientValidationResponse) {
				formController.handleFormValidationErrors(clientValidationResponse, form)
				formController.handleButtonState(false, submitButton, "Register")
				return
			}
			try {
				const { data, error } = await actions.auth.userRegister(formData)
				if (isInputError(error)) {
					const serverErrorResponse = { 
						errorType: "inputValidationError", 
						errors: error.fields 
					} as ValidationErrorResponse
					formController.handleFormValidationErrors(serverErrorResponse, form)
					formController.handleButtonState(false, submitButton, "Register")
				}
				if (error?.code === "UNAUTHORIZED" || error?.code === "TIMEOUT") {
					formController.handleButtonState(false, submitButton, "Register")
					Toast({ message: error.message })
				}
				if (data) {
					form.reset()
					formController.handleButtonState(false, submitButton, "Register")
					formController.resetStoreStates()
					render()
					Toast({ message: data.message })
				}
			} catch (error: any) {
				formController.handleButtonState(false, submitButton, "Register")
				Toast({ message: `Error connection: ${error.message}` })
			}
		}
	}

	const template = () => html`
		<vaadin-button 
			@click=${backToSignInForm} 
			theme="tertiary-inline" 
			class="text-s">
			<vaadin-icon 
				slot="prefix" 
				class="me-xs" 
				src="/circle-arrow-left.svg">
			</vaadin-icon>
			Back
		</vaadin-button>
		<form @submit=${handleSubmit} class="mt-m flex flex-col gap-s">
			<p>Register as a new user.</p>
			<vaadin-text-field
				@input=${formController.handleFieldChange}
				.required=${true}
				.manualValidation=${true}
				name="first_name" 
				label="First name">
			</vaadin-text-field>
			<vaadin-text-field
				@input=${formController.handleFieldChange}
				.required=${true}
				.manualValidation=${true}
				name="last_name" 
				label="Last name">
			</vaadin-text-field>
			<vaadin-email-field
				@input=${formController.handleFieldChange}
				.required=${true}
				.manualValidation=${true} 
				name="email" 
				label="Email address">
			</vaadin-email-field>
			<vaadin-password-field
				@input=${formController.handleFieldChange}
				.required=${true}
				.manualValidation=${true} 
				name="password" 
				label="Password">
			</vaadin-password-field>
			<vaadin-password-field
				@input=${formController.handleFieldChange}
				.required=${true}
				.manualValidation=${true} 
				name="confirm_password" 
				label="Confirm password">
			</vaadin-password-field>
			<vaadin-button
				@click=${formController.handleActionButtonClick}
				?disabled=${formController.actionButtonDisabled.get()}
				id="userRegisterButton"
				theme="primary">
				Register
			</vaadin-button>
			<input
				?disabled=${formController.actionButtonDisabled.get()}
				type="submit" 
				hidden 
			/>
		</form>
	`

	const render = () => {
		observeAndRender({
			template: template(),
			targetSelector: "#registerPanel > .Panels-panel-wrapper",
			renderOptions: { host: formController }
		})
	}

	formController.setRenderCallback(render)
	formController.setValidationSchema(newUser)

	render()

}
