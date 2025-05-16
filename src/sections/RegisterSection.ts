import { html } from "lit-html"

export function RegisterSection() {

	const showRegisterForm = () => {
		const signInPanel = document.querySelector<HTMLDivElement>("#signInPanel")
		const registerPanel = document.querySelector<HTMLDivElement>("#registerPanel")
		if (signInPanel) signInPanel.dataset.active = "false"
		if (registerPanel) registerPanel.dataset.active = "true"
	}

	const template = html`
		<p class="m-auto text-secondary text-center text-s">
			Don't have an account?
			<vaadin-button @click=${showRegisterForm} theme="tertiary-inline">
				Register here
			</vaadin-button>
		</p>
	`

	return html`
		${template}
	`

}
