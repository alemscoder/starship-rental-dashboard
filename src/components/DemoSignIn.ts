import { html } from "lit-html"
import router from "@router/router.ts"
import { Toast } from "@components/Toast.ts"
import { actions, isInputError } from "astro:actions"
import { selectRenderer } from "@vaadin/select/lit.js"
import type { Employee } from "../types.ts"
import type { Button } from "@vaadin/button"

export function DemoSignIn() {

	let employeeList: Employee[] | null = null

	const backToSignInForm = () => {
		const signInPanel = document.querySelector<HTMLDivElement>("#signInPanel")
		const demoSignInPanel = document.querySelector<HTMLDivElement>("#demoSignInPanel")
		if (signInPanel) signInPanel.dataset.active = "true"
		if (demoSignInPanel) demoSignInPanel.dataset.active = "false"
	}

	const handleDemoSignIn = async (event: MouseEvent) => {
		const target = event.currentTarget as Button
		const loginContainer = target.closest(".login-container")
		const form = target.closest("form")
		const select = form?.querySelector("vaadin-select")
		const email = select?.value!
		if (!select?.value) return
		target.disabled = true
		loginContainer?.classList.add("loading")
		try {
			const { data, error } = await actions.auth.loginWithLink({ email })
			if (isInputError(error)) {
				if (select && error.fields.email) {
					select.invalid = true
					select.errorMessage = error.fields.email[0]
				}
				target.disabled = false
				loginContainer?.classList.remove("loading")
			}
			if (error?.type === "AstroActionError") {
				Toast({ message: error.message })
				target.disabled = false
				loginContainer?.classList.remove("loading")
			}
			if (data) {
				await router.navigate("/rentals/tickets")
				const onUserDataLoaded = () => {
					window.removeEventListener("user-data-loaded", onUserDataLoaded)
					Toast({ message: data.message })
				}
				window.removeEventListener("user-data-loaded", onUserDataLoaded)
				window.addEventListener("user-data-loaded", onUserDataLoaded)
			}
		} catch (error: any) {
			Toast({ message: `Network error connection: ${error.message}` })
			target.disabled = false
			loginContainer?.classList.remove("loading")
		}
	}

	const employeeInfoRenderer = () => html`
		<vaadin-list-box>
			${employeeList?.map(
				(employee) => html`
					<vaadin-item 
						value="${employee.email}" 
						label="${employee.first_name + " " + employee.last_name}">
						<div class="flex items-center">
							<vaadin-avatar 
								class="mr-s"
								abbr=${employee.first_name[0]}${employee.last_name[0]}
								name=${employee.first_name} ${employee.last_name}>
							</vaadin-avatar>
							<div>
								${employee.first_name + " " + employee.last_name}
								<div class="text-s text-secondary">
									${employee.job_title}
								</div>
							</div>
						</div>
					</vaadin-item>
				`
			)}
		</vaadin-list-box>
	`

	const getEmployeeList = () => {
		fetch("/api/demo-users", {
			headers: {
				"x-demo-mode": import.meta.env.PUBLIC_APP_DEMO_MODE
			},
			credentials: "same-origin"
		})
		.then((response) => {
			if (!response.ok) {
				throw new Error("No demo users found.")
			}
			return response.json()
		})
		.then((data: Employee[]) => {
			employeeList = data
		})
		.catch(error => {
			console.error("Error fetching demo users:", error.message)
			employeeList = null
			const demoSignInButton = document.querySelector("#demoSignInButton")
			if (demoSignInButton) {
				demoSignInButton.remove()
			}
		})
	}
	getEmployeeList()

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
		<form class="mt-m flex flex-col gap-s">
			<vaadin-select
				label="Select user"
				${selectRenderer(employeeInfoRenderer)}>
			</vaadin-select>
			<vaadin-button
				@click=${handleDemoSignIn}
				theme="primary">
				Demo Sign In
			</vaadin-button>
		</form>
	`

	return html`
		${template}
	`

}
