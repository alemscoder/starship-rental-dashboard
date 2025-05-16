import router from "@router/router"
import { Toast } from "@components/Toast.ts"
import { actions, isInputError } from "astro:actions"
import type { LoginForm, LoginI18n, LoginFormLoginEvent } from "@vaadin/login/vaadin-login-form"

export async function handleI18n() {
	let i18n: LoginI18n
	const lang = document.documentElement.lang
	switch (lang) {
		case "en":
			i18n = await import("../i18n/login-form-en.json")
			break
		case "es":
			i18n = await import("../i18n/login-form-es.json")
			break
		default:
			i18n = await import("../i18n/login-form-en.json")
			break
	}
	return i18n
}

export async function handleLogin(event: LoginFormLoginEvent & { target: LoginForm }) {
	const textField = event.target.querySelector("vaadin-text-field")
	const passwordField = event.target.querySelector("vaadin-password-field")
	const { username: email, password } = event.detail
	try {
		const { data, error } = await actions.auth.loginWithPassword({ email, password })
		if (isInputError(error)) {
			if (textField && error.fields.email) {
				textField.invalid = true
				textField.errorMessage = error.fields.email[0]
			}
			if (passwordField && error.fields.password) {
				passwordField.invalid = true
				passwordField.errorMessage = error.fields.password[0]
			}
			event.target.disabled = false
		}
		if (error?.code === "UNAUTHORIZED") {
			event.target.error = true
		}
		if (error?.code === "TIMEOUT") {
			event.target.disabled = false
			Toast({ message: error.message })
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
		event.target.disabled = false
		Toast({ message: `Network error connection: ${error.message}` })
	}
	
}
