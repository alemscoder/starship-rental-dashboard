import { html, nothing } from "lit-html"
import { EmailSignIn } from "@components/EmailSignIn.ts"
import { SocialSignIn } from "@components/SocialSignIn.ts"
import { RegisterSection } from "@sections/RegisterSection.ts"

export async function SignInSection() {

	const showDemoSignInForm = () => {
		const signInPanel = document.querySelector<HTMLDivElement>("#signInPanel")
		const demoSignInPanel = document.querySelector<HTMLDivElement>("#demoSignInPanel")
		if (signInPanel) signInPanel.dataset.active = "false"
		if (demoSignInPanel) demoSignInPanel.dataset.active = "true"
	}

	const demoSignInButtonTemplate = html`
		<vaadin-button
			@click=${showDemoSignInForm}
			id="demoSignInButton" 
			theme="tertiary-inline" 
			class="w-full">
			Sign In as Demo User
		</vaadin-button>
	`

	const template = html`
		${import.meta.env.PUBLIC_APP_DEMO_MODE === "true" ? demoSignInButtonTemplate : nothing}
		${SocialSignIn()}
		${await EmailSignIn()}
		${RegisterSection()}
	`

	return html`
		${template}
	`
}
