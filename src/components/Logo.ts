import { html, nothing } from "lit-html"
import router from "@router/router.ts"

export function Logo() {

	const handleAnchorNavigation = (event: MouseEvent) => {
		event.preventDefault()
		const { href } = router.context.url
		const anchor = event.currentTarget as HTMLAnchorElement
		const path = anchor.href
		if (href === path) return
		router.navigate(path)
	}

	const template = () => {
		const isRootPathname = location.pathname === "/"
		return html`
			<a @click=${handleAnchorNavigation} href="/">
				<vaadin-icon class="logo" src="/starship.svg"></vaadin-icon>
				${ isRootPathname
					? html`
						<h1>Admin Panel</h1>
					`
					: nothing
				}
			</a>
			
		`
	}

	return html`
		${template()}
	`

}
