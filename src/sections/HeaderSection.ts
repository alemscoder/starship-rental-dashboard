import { html, type TemplateResult } from "lit-html"
import "@styles/header-section.css"

export interface HeaderContent {
	/**
	 * Set the `lit-html` template content for 
	 * render inside the header section.
	 */
	templateContent: TemplateResult
}

/**
 * Renders the header section, including a drawer toggle and custom template content.
 *
 * @param content - An object containing the `templateContent` 
 * property, which is rendered inside the header.
 * @returns A template literal representing the header section 
 * with a drawer toggle and the provided content.
 */
export function HeaderSection(content: HeaderContent) {
	const { templateContent } = content
	return html`
		<header class="View-header">
			<vaadin-drawer-toggle>
				<vaadin-icon src="/drawer.svg"></vaadin-icon>
			</vaadin-drawer-toggle>
			${templateContent}
		</header>
	`
}
