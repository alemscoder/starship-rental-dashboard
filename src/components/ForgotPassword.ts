import { html } from "lit-html"
import { Toast } from "@components/Toast.ts"
import { Forms } from "@controllers/forms.ts"
import { actions, isInputError } from "astro:actions"

const formController = new Forms<{email: string}>()

export function ForgotPassword() {

	const disabledResetPassword = true

	const backToSignInForm = () => {
		const signInPanel = document.querySelector<HTMLDivElement>("#signInPanel")
		const forgotPasswordPanel = document.querySelector<HTMLDivElement>("#forgotPasswordPanel")
		if (signInPanel) signInPanel.dataset.active = "true"
		if (forgotPasswordPanel) forgotPasswordPanel.dataset.active = "false"
	}

	const handleResetPassword = async (event: SubmitEvent) => {
		if (disabledResetPassword) {
			event.preventDefault()
			return Toast({ message: "Password reset temporarily disabled." })
		} else {
			event.preventDefault()
			const form = event.currentTarget as HTMLFormElement
			const emailField = form.querySelector("vaadin-email-field")
			const submitButton = formController.getActionButton(
				"#forgotPasswordPanel #resetPasswordButton"
			)
			if (submitButton) submitButton.disabled = true
			if (emailField && !emailField.value) {
				emailField.invalid = true
				emailField.errorMessage = "Please enter your email address."
				if (submitButton) submitButton.disabled = false
				return
			}
			const formData = new FormData(form)
			try {
				const { data, error } = await actions.auth.resetPassword(formData)
				if (isInputError(error)) {
					if (emailField && error.fields.email) {
						emailField.invalid = true
						emailField.errorMessage = error.fields.email[0]
						if (submitButton) submitButton.disabled = false
					}
				}
				if (error?.code === "UNAUTHORIZED" || error?.code === "TIMEOUT") {
					if (submitButton) submitButton.disabled = false
					Toast({ message: error.message })
				}
				if (data) {
					if (submitButton) submitButton.disabled = false
					Toast({ message: data.message })
				}
			} catch (error: any) {
				if (submitButton) submitButton.disabled = false
				Toast({ message: `Error connection: ${error.message}` })
			}
		}
	}

	const template = html`
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
		<form @submit=${handleResetPassword} class="mt-m flex flex-col gap-s">
			<p>Enter your account email address and we'll send you a password reset link.</p>
			<vaadin-email-field 
				name="email" 
				class="flex" 
				label="Email Address">
			</vaadin-email-field>
			<vaadin-button
				@click=${formController.handleActionButtonClick}
				id="resetPasswordButton" 
				theme="primary">
				Reset Password
			</vaadin-button>
			<input
				type="submit" 
				hidden 
			/>
		</form>
	`

	return html`
		${template}
	`
}
