import { html, nothing, render } from "lit-html"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { SignInSection } from "@sections/SignInSection.ts"
import { UserRegister } from "@components/UserRegister.ts"
import { ForgotPassword } from "@components/ForgotPassword.ts"
import "@styles/login.css"

export async function Login() {
	
	const container = document.querySelector("#outlet") as HTMLDivElement

	const demoSignInPanelTemplate = async () => {
		const { DemoSignIn } = await import("@components/DemoSignIn.ts")
		return html`
			<div class="Panels-panel" id="demoSignInPanel" data-active="false">
				<div class="Panels-panel-wrapper">
					${DemoSignIn()}
				</div>
			</div>
		`
	}
	
	const template = html`
		<div class="login-container">
			<div class="View framed login-view">
				${HeaderSection({
					templateContent: html`
						<vaadin-icon class="logo" src="/starship.svg"></vaadin-icon>
						<h1>Control Panel</h1>
					`
				})}
				<vaadin-scroller theme="overflow-indicators" class="View-content">
					<div class="Panels">
						<div class="Panels-panel" id="signInPanel" data-active="true">
							<div class="Panels-panel-wrapper">
								${await SignInSection()}
							</div>
						</div>
						${import.meta.env.PUBLIC_APP_DEMO_MODE === "true" ? await demoSignInPanelTemplate() : nothing}
						<div class="Panels-panel" id="registerPanel" data-active="false">
							<div class="Panels-panel-wrapper">
								${UserRegister()}
							</div>
						</div>
						<div class="Panels-panel" id="forgotPasswordPanel" data-active="false">
							<div class="Panels-panel-wrapper">
								${ForgotPassword()}
							</div>
						</div>
					</div>
				</vaadin-scroller>
			</div>
		</div>
	`

	render(template, container)
}
