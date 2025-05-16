import { html } from "lit-html"
import { handleI18n, handleLogin } from "@controllers/login-form"
import "@styles/email-sign-in.css"

export async function EmailSignIn() {

	const showForgotPasswordForm = () => {
		const signInPanel = document.querySelector<HTMLDivElement>("#signInPanel")
		const forgotPasswordPanel = document.querySelector<HTMLDivElement>("#forgotPasswordPanel")
		if (signInPanel) signInPanel.dataset.active = "false"
		if (forgotPasswordPanel) forgotPasswordPanel.dataset.active = "true"
	}
	
	const i18n = await handleI18n()

	const template = html`
		<vaadin-login-form 
			.i18n=${i18n} 
			@login=${handleLogin} 
			@forgot-password=${showForgotPasswordForm}
			no-autofocus>
		</vaadin-login-form>
	`

	return html`
		${template}
	`

}
