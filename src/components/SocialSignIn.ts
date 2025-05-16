import { html } from "lit-html"
import { Toast } from "@components/Toast.ts"
import type { Button } from "@vaadin/button"
import "@styles/social-sign-in.css"

export function SocialSignIn() {

	const disabledSocialSignIn = true

	const handleSocialSignIn = (event: MouseEvent) => {
		if (disabledSocialSignIn) {
			return Toast({ message: "Social sign in temporarily disabled." })
		} else {
			const form = document.querySelector("form#socialSignIn")
			if (form instanceof HTMLFormElement) {
				const vaadinButton = event.currentTarget as Button
				const name = vaadinButton.getAttribute("name") as string
				const value = vaadinButton.getAttribute("value") as string
				const input = document.createElement("input")
				input.type = "hidden"
				input.name = name
				input.value = value
				form.appendChild(input)
				form.submit()
			}
		}
	}

	const template = html`
		<form 
			action="/api/auth/login-with-oauth" 
			method="post" 
			id="socialSignIn" 
			class="flex gap-s mt-l mb-l">
			<vaadin-button
				@click=${handleSocialSignIn} 
				name="provider"
				value="google"
				aria-label="Sign in with Google">
				<vaadin-icon src="/google.svg"></vaadin-icon>
			</vaadin-button>
			<vaadin-button
				@click=${handleSocialSignIn}
				name="provider"
				value="facebook"
				aria-label="Sign in with Facebook">
				<vaadin-icon src="/facebook.svg"></vaadin-icon>
			</vaadin-button>
			<vaadin-button
				@click=${handleSocialSignIn}
				name="provider"
				value="twitter"
				aria-label="Sign in with X">
				<vaadin-icon src="/x.svg"></vaadin-icon>
			</vaadin-button>
			<vaadin-button
				@click=${handleSocialSignIn}
				name="provider"
				value="github"
				aria-label="Sign in with Github">
				<vaadin-icon src="/github.svg"></vaadin-icon>
			</vaadin-button>
		</form>
	`

	return html`
		${template}
	`
}
