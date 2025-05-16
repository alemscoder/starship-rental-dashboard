import { html } from "lit-html"
import { EmailSignIn } from "@components/EmailSignIn.ts"
import { SocialSignIn } from "@components/SocialSignIn.ts"
import { RegisterSection } from "@sections/RegisterSection.ts"

export async function SignInSection() {

	const template = html`
		${SocialSignIn()}
		${await EmailSignIn()}
		${RegisterSection()}
	`

	return html`
		${template}
	`
}
