import { html } from "lit-html"
import router from "@router/router.ts"

export function Logo() {

	const handleAnchorNavigation = (event: MouseEvent) => {
		event.preventDefault()
		const anchor = event.currentTarget as HTMLAnchorElement
		const path = anchor.href
		router.navigate(path)
	}

	const template = html`
		<a @click=${handleAnchorNavigation} href="/">
			<vaadin-icon class="logo" src="/starship.svg"></vaadin-icon>
		</a>
		
	`

	return html`
		${template}
	`

}
