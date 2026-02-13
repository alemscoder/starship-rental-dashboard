import { z } from "astro:schema"
import router from "@router/router.ts"
import { atom, map } from "nanostores"
import { Toast } from "@components/Toast.ts"
import { formatZodErrors } from "@utils/zod.ts"
import type { Button } from "@vaadin/button"
import type { TextField } from "@vaadin/text-field"
import type { ServerSuccessResponse, ValidationErrorResponse, ApiEndpointConfig } from "../types.ts"

/**
 * A versatile form management controller for handling form state,
 * validation, and interaction across different types of forms.
 * 
 * The `Forms` class provides a robust set of utilities for:
 * - Managing form data using Nano stores.
 * - Performing client-side validation with Zod schemas.
 * - Handling form field interactions.
 * - Managing form submission and button states.
 * 
 * Key Features:
 * - Real-time form data tracking.
 * - Dynamic client-side validation.
 * - Flexible error handling.
 * - Button state management.
 * - Customizable render callbacks.
 * @template T The type of form data being managed
 * @example
 * // Creating a form controller for a user registration form
 * const formController = new Forms<UserRegistration>(
 *   renderCallback, 
 *   userRegistrationSchema
 * );
 */
export class Forms<T> {

	/**
	 * Tracks whether the form is in edit mode.
	 * This private property determines if the form is being used 
	 * for editing an existing record. When `true`, the validation 
	 * schema will be treated as partial, allowing optional fields.
	 * When `false`, the validation schema will enforce all required fields.
	 * @private
	 */
	#isEditMode = false

	/** 
	 * Stores a render callback function.
	 * @private 
	 */
	#renderCallback?: (() => void)

	/** 
	 * Stores the validation Zod schema for the form.
	 * @private 
	 */
	#validationSchema?: z.ZodObject<any> | z.ZodEffects<any>

	/** 
	 * Nano store for managing records form data.
	 * @public 
	 */
	public recordsFormData = map<Partial<T>>({})

	/** 
	 * Nano store for tracking form validation errors.
	 * @public 
	 */
	public formValidationErrors = map<Record<string, string>>({})

	/** 
	 * Nano store for managing the disabled state of action buttons in forms.
	 * @public 
	 */
	public actionButtonDisabled = atom(true)

	/**
	 * A mapping between form field names and their respective error message container selectors.
	 *
	 * This property stores key-value pairs where:
	 * - **Key**: Represents the name of the form field (e.g., "planet_avatar" or "location_landscape").
	 * - **Value**: Is a CSS selector string that identifies the HTML element where the validation
	 *   error message for that field should be displayed.
	 *
	 * This configuration allows the form controller to dynamically update the correct error display
	 * element for each field, making the error handling mechanism flexible and reusable across different
	 * forms or dialogs with varying field names and DOM structures.
	 *
	 * @public
	 */
	public errorValidationContainers: Record<string, string> = {}

	/**
	 * Tracks fields with client-side validation errors not covered by the Zod schema.
	 * 
	 * This set contains the names of form fields that fail custom or local validation
	 * checks, or fields excluded from the main validation schema.
	 * 
	 * @public
	 */
	public localValidationErrors = new Set<string>()

	/**
	 * Constructor that accepts an optional callback 
	 * render function or a validation Zod schema.
	 * @param render - The callback render function.
	 * @param schema - The Zod schema used for validating form data.
	 */
	constructor(render?: () => void, schema?: z.ZodObject<any> | z.ZodEffects<any>) {
		this.#renderCallback = render
		this.#validationSchema = schema
	}

	/**
	 * Sets the edit mode for the form.
	 * 
	 * This method updates the internal state to indicate whether 
	 * the form is being used for editing an existing record (`true`) 
	 * or creating a new one (`false`). When in edit mode, the validation 
	 * schema will be treated as partial, allowing optional fields. 
	 * In create mode, all required fields will be enforced.
	 * @public
	 * @param isEdit - A boolean indicating whether the form is in edit mode.
	 */
	public setEditMode(isEdit: boolean) {
		this.#isEditMode = isEdit
	}

	/**
	 * Sets or updates the callback render function.
	 * @public
	 * @param render - The callback render function.
	 */
	public setRenderCallback(render: () => void) {
		this.#renderCallback = render
	}

	/**
	 * Sets or updates the validation schema.
	 * @public
	 * @param schema - The new Zod schema to use for validation.
	 */
	public setValidationSchema(schema: z.ZodObject<any> | z.ZodEffects<any>) {
		this.#validationSchema = schema
	}

	/**
	 * Gets the action button element in the form.
	 * @public
	 * @returns The action button element or null if not found.
	 */
	public getActionButton(buttonSelector: string): Button | null {
		return document.querySelector(buttonSelector)
	}

	/**
	 * Enables the action button in the form.
	 * 
	 * If the action button is currently disabled, it sets 
	 * the `actionButtonDisabled` nano store to `false` and execute
	 * the callback render function if provided.
	 * @public
	 */
	public enableActionButton() {
		if (this.actionButtonDisabled.get()) {
			this.actionButtonDisabled.set(false)
			if (this.#renderCallback) {
				this.#renderCallback()
			}
		}
	}

	/**
	 * Handles the loading state of a button by toggling its disabled state 
	 * and showing/hiding a spinner icon.
	 * When the state is true (loading), the button becomes disabled, its 
	 * text is cleared, and a spinner icon is added. When the state is false 
	 * (not loading), the button is re-enabled, the spinner is removed,
	 * and the original text is restored if provided.
	 * 
	 * @public
	 * @param state - The loading state. True to show loading (disable button + show spinner), 
	 * false to hide loading (enable button + hide spinner)
	 * @param buttonTarget - The button element to modify. If null, the method returns early
	 * @param buttonInnerText - Optional text to restore to the button when loading state is false.
	 * If not provided, the button text remains empty after loading
	 * @example
	 * // Show loading state
	 * this.handleButtonState(true, submitButton);
	 * 
	 * // Hide loading state and restore button text
	 * this.handleButtonState(false, submitButton, "Submit Form");
	 */
	public handleButtonState(
		state: boolean, 
		buttonTarget: Button | null, 
		buttonInnerText?: string
	) {
		if (!buttonTarget) return
		const icon = document.createElement("vaadin-icon")
		icon.setAttribute("src", "/spinner.svg")
		if (state === true) {
			buttonTarget.disabled = true
			buttonTarget.innerText = ""
			buttonTarget.appendChild(icon)
		} else {
			buttonTarget.disabled = false
			const existingIcon = buttonTarget.querySelector("vaadin-icon[src='/spinner.svg']")
			if (existingIcon) existingIcon.remove()
			if(buttonInnerText) buttonTarget.innerText = buttonInnerText
		}
	}

	/**
	 * Handles the click event for the action button.
	 * 
	 * Submit the closest form element when the button is 
	 * clicked. Because the `vaadin-button` don't have a 
	 * `type='submit'`, the `requestSubmit()` method of the form
	 * is called manually in this method.
	 * @public
	 * @param event - The mouse event triggered by the button click.
	 */
	public handleActionButtonClick = (event: MouseEvent) => {
		const form = (event.currentTarget as Button).closest("form")
		if (form instanceof HTMLFormElement) {
			form.requestSubmit()
		}
	}

	/**
	 * Handles the change event for form fields.
	 * 
	 * Updates the `recordsFormData` state with the new value
	 * of the changed field.
	 * 
	 * Validates the field in real-time and updates the field
	 * error state accordingly if the validation Zod schema is provided.
	 * @public
	 * @param event - The input event triggered by the field change.
	 */
	public handleFieldChange(event: InputEvent) {
		const field = event.currentTarget as TextField
		const fieldName = field.name
		const fieldValue = field.value
		const oldValues = this.recordsFormData.get()
		this.recordsFormData.set({ 
			...oldValues, 
			[fieldName]: fieldValue
		})
		console.log(this.recordsFormData.get())
		if (this.#validationSchema) {
			const clientValidationResponse = this.validateFormData(this.recordsFormData.get())
			if (clientValidationResponse) {
				this.handleFormValidationErrors(clientValidationResponse)
				field.errorMessage = this.formValidationErrors.get()[fieldName]
				field.invalid = !!this.formValidationErrors.get()[fieldName]
				return
			}
			field.errorMessage = undefined
			field.invalid = false
			this.enableActionButton()
		}
	}

	/**
	 * Checks if there are unsaved changes in the form.
	 * @public
	 * @returns True if there are unsaved changes, false otherwise.
	 */
	public handleUnsavedChanges() {
		return Object.keys(this.recordsFormData.get()).length !== 0
	}

	/**
	 * Appends specified form fields to a `FormData` object.
	 * 
	 * This method iterates over the provided `fieldNames` array and extracts 
	 * corresponding values from the `data` object. If the value is defined 
	 * (including empty strings), it is appended to the `FormData` instance.
	 * @public
	 * @param formData - The `FormData` object to which the fields will be appended.
	 * @param recordData - The partial record data object containing the fields to be appended.
	 * @param fieldNames - An array of field names to be extracted from `recordData` and appended to `formData`.
	 */
	public appendFormFields(formData: FormData, recordData: Partial<T>, fieldNames: string[]) {
		fieldNames.forEach(field => {
			const value = recordData[field as keyof T] as string | Blob
			if (value !== undefined && (value || value === "")) {
				formData.append(field, value)
			}
		})
	}

	/**
	 * Handles appending a file or string value to a `FormData` object.
	 * 
	 * If the value is an empty string, it appends an empty string to ensure the field is sent.
	 * Otherwise, if the value is defined, it appends it to the `FormData` instance.
	 * @public
	 * @param formData - The `FormData` object to which the field will be appended.
	 * @param fieldName - The name of the field to append.
	 * @param value - The value to append, which can be a `string` or a `Blob`.
	 */
	public handleFileField(formData: FormData, fieldName: string, value: string | Blob) {
		if (value === "") {
			formData.append(fieldName, "")
		} else if (value) {
			formData.append(fieldName, value)
		}
	}

	/**
	 * Validates the form data using the predefined Zod schema.
	 * 
	 * This method performs client-side validation of the form data against the 
	 * configured Zod schema. If no schema is set, it logs a warning and returns 
	 * undefined. When validation fails, it formats the Zod validation errors 
	 * into a structured error response.
	 * The method checks if the schema is an instance of `ZodObject` or a `ZodEffects`
	 * that wraps a `ZodObject`. If so and `isEditMode` is `true`, it applies the 
	 * `.partial()` method to allow partial validation of the form data. For other
	 * schema types (e.g., `ZodString`, `ZodNumber`), the schema is used as-is.
	 * @public
	 * @param formData - The partial form data to validate. This can be an 
	 * incomplete set of properties for the generic type T.
	 * @returns A `ValidationErrorResponse` containing formatted validation 
	 * errors if validation fails, or `undefined` if the data is valid, no validation
	 * schema is configured, or the schema does not support partial validation.
	 */
	public validateFormData(formData: Partial<T>) {
		if (!this.#validationSchema) {
			console.warn("No validation schema set for form validation client side.")
			return
		}
		const isObjectSchema = 
			this.#validationSchema instanceof z.ZodObject || 
			(this.#validationSchema instanceof z.ZodEffects && 
			this.#validationSchema.innerType() instanceof z.ZodObject)
		let schemaToUse = this.#validationSchema
		if (this.#isEditMode && isObjectSchema && 'partial' in this.#validationSchema) {
			schemaToUse = this.#validationSchema.partial()
		}
		const parseResult = schemaToUse.safeParse(formData)
		if (!parseResult.success) {
			const formattedErrors = formatZodErrors(parseResult.error)
			return { 
				errorType: "inputValidationError", 
				errors: formattedErrors 
			} as ValidationErrorResponse
		}
	}

	/**
	 * Processes and manages form validation errors from server or client-side validation.
	 * 
	 * This method performs several key actions:
	 * - Clears previous validation errors.
	 * - Stores new validation errors in the internal state.
	 * - Optionally updates the visual validation state of form fields.
	 * 
	 * The method consolidates error messages for each field, allowing multiple 
	 * validation errors per field to be displayed as a multi-line error message.
	 * @public
	 * @param errorResponse - The validation error response containing field-specific errors.
	 * @param form - Optional HTML form element to automatically update field validation states.
	 */
	public handleFormValidationErrors(errorResponse: ValidationErrorResponse, form?: HTMLFormElement) {
		this.formValidationErrors.set({})
		for (const fieldName in errorResponse.errors) {
			if (errorResponse.errors.hasOwnProperty(fieldName)) {
				const messages = (errorResponse.errors)[fieldName].join("\n")
				const prevErrors = this.formValidationErrors.get()
				this.formValidationErrors.set({ ...prevErrors, [fieldName]: messages })
			}
		}
		console.log(this.formValidationErrors.get())
		if (form) this.updateFieldsValidationState(form)
	}

	/**
	 * Updates the visual validation state of form fields based on stored validation errors.
	 *
	 * This method performs a comprehensive validation update:
	 * - Retrieves all validation errors from the stored state.
	 * - Updates the `invalid` property and error message for corresponding text fields.
	 * - Updates error messages for specific UI elements.
	 *
	 * It provides a centralized way to reflect validation errors in the UI,
	 * ensuring consistent error presentation across different form fields.
	 *
	 * @protected
	 * @param form - The HTML form element containing fields to validate.
	 */
	protected updateFieldsValidationState(form: HTMLFormElement) {
		const validationErrors = this.formValidationErrors.get()
		const updateErrorDisplay = (element: HTMLSpanElement | null, errorMessage: string) => {
			if (element && errorMessage) {
				element.innerText = errorMessage
				element.parentElement?.classList.toggle("hidden", !errorMessage)
				element.parentElement?.classList.toggle("block", !!errorMessage)
			}
		}
		Object.entries(validationErrors).forEach(([fieldName, errorMessage]) => {
			if (!errorMessage) return
			const field = form.querySelector(`[name="${fieldName}"]`) as TextField | null
			if (field) {
				field.invalid = true
				field.errorMessage = errorMessage
			}
			const errorSelector = this.errorValidationContainers[fieldName]
			if (errorSelector) {
				const errorElement = form.querySelector(errorSelector) as HTMLElement | null
				updateErrorDisplay(errorElement, errorMessage)
			}
		})
	}

	/**
	 * Handles a successful server response by parsing the response based on its content type.
	 * If the response is JSON, it extracts the `message` and the remaining payload.
	 * - If the payload contains only one key, it returns its value as the payload.
	 * - If the payload contains multiple keys, it returns the entire payload object.
	 * If the response is not JSON, it returns the response text as the message and `null` as the payload.
	 *
	 * @public
	 * @param response - The server response to handle.
	 * @returns An object containing a `message` and a `payload` extracted from the response.
	 */
	public async handleServerSuccessResponse(response: Response) {
		const contentType = response.headers.get("Content-Type")
		if (contentType && contentType.includes("application/json")) {
			const data = await response.json() as ServerSuccessResponse
			const { message, ...rest } = data
			let payload: T | Record<string, unknown> | null = null
			const keys = Object.keys(rest)
			if (keys.length === 1) {
				payload = rest[keys[0]] as T
			} else if (keys.length > 1) {
				payload = rest
			}
			return {
				message: message ?? "Operation completed successfully!",
				payload: payload
			}
		} else {
			const text = await response.text()
			return {
				message: text,
				payload: null
			}
		}
	}

	/**
	 * Handles and parses error responses from server requests based on their content type.
	 * 
	 * This method provides a flexible approach to processing server error responses:
	 * - For JSON responses, it parses the error data into a structured `ValidationErrorResponse`.
	 * - For non-JSON responses, it returns the raw error text.
	 * 
	 * This allows for consistent error handling across different types of server responses,
	 * supporting both structured validation errors and plain text error messages.
	 * @public
	 * @param response - The fetch Response object representing the server's error response
	 * @returns A `ValidationErrorResponse` if the content type is JSON
	 * or a string if it's plain text or another type.
	 */
	public async handleServerErrorResponse(response: Response) {
		const contentType = response.headers.get("Content-Type")
		if (contentType && contentType.includes("application/json")) {
			const errorData = await response.json() as ValidationErrorResponse
			return errorData
		} else {
			const errorText = await response.text()
			return errorText
		}
	}

	/**
	 * Constructs an API endpoint based on the provided configuration.
	 * @public
	 * @param config - The configuration object specifying the type of action and resource name.
	 * @returns The constructed API endpoint as a string.
	 * @example
	 * // Example usage:
	 * const endpoint = getApiEndpoint({ type: "edit", name: "employee" });
	 * console.log(endpoint); // Output: "/api/edit-employee"
	 */
	public getApiEndpoint(config: ApiEndpointConfig) {
		const { type, name } = config
		return `/api/${type}-${name}`
	}

	/**
	 * Processes the form submission by validating the data, sending it to the specified API endpoint, 
	 * handling server responses, and updating the UI accordingly.
	 * 
	 * If the form contains only the "id" field, the submission is skipped.
	 * Performs client-side validation and handles validation errors if necessary.
	 * Sends a POST request to the API with the form data.
	 * If the response contains server-side validation errors, they are displayed in the form.
	 * Displays a toast message for general errors or success responses.
	 * @public
	 * @async
	 * @param formData - The `FormData` object containing the form fields.
	 * @param apiEndpoint - The API endpoint to which the form data will be sent.
	 * @param form - The `HTMLFormElement` representing the form being submitted.
	 * @param actionButton - The `Button` element representing the action button, which will be enabled/disabled accordingly.
	 * @param onSuccess - Callback on successful submission. Receives an optional payload parameter containing the server response data.
	 */
	public async processFormSubmission(
		formData: FormData,
		apiEndpoint: string,
		form: HTMLFormElement,
		actionButton: Button | null,
		onSuccess?: (payload?: T | Record<string, unknown> | null) => void
	) {
		const actionButtonText = actionButton?.id.includes("save") ? "Save" : "Submit"
		const keys = Array.from(formData.keys())
		if (keys.length === 1 && keys[0] === "id") {
			this.handleButtonState(false, actionButton, actionButtonText)
			return
		}
		const formEntries = Object.fromEntries(formData.entries()) as Partial<T>
		const clientValidation = this.validateFormData(formEntries)
		if (clientValidation) {
			this.handleFormValidationErrors(clientValidation, form)
			this.handleButtonState(false, actionButton, actionButtonText)
			return
		}
		try {
			const response = await fetch(apiEndpoint, { 
				method: "POST", 
				body: formData 
			})
			if (!response.ok) {
				const serverErrorResponse = await this.handleServerErrorResponse(response)
				if (
					typeof serverErrorResponse === "object" && 
					serverErrorResponse.errorType === "inputValidationError"
				) {
					this.handleFormValidationErrors(serverErrorResponse, form)
				} else if (typeof serverErrorResponse === "string") {
					Toast({ message: serverErrorResponse })
				}
				this.handleButtonState(false, actionButton, actionButtonText)
			}
			if (response.ok) {
				const { message, payload } = await this.handleServerSuccessResponse(response)
				Toast({ message: message })
				onSuccess?.(payload)
			}
		} catch (error) {
			console.error("There was a problem with the fetch operation:", error)
		}
		console.log('Form data:', Object.fromEntries(formData.entries()))
	}

	/**
	 * Prepares the form data for a delete request by appending the record ID 
	 * and any specified file fields.
	 * 
	 * This method ensures that the necessary fields are included in the 
	 * form data before submitting a delete request.
	 * @public
	 * @param formData - The FormData object to append data to.
	 * @param recordDetails - The record containing details of the item to be deleted.
	 * @param fileFields - An array of field names that may contain file data to be included in the form data.
	 * @returns The updated FormData object with the necessary fields appended.
	 */
	public prepareDeleteFormData<T extends { id: string }>(
		formData: FormData, 
		recordDetails: T, 
		fileFields?: (keyof T)[]
	) {
		formData.append("id", recordDetails.id)
		fileFields?.forEach(field => {
			const value = recordDetails[field]
			if (value) formData.append(field as string, value as string | Blob)
		})
		return formData
	}

	/**
	 * Processes a delete request by sending form data to the specified API endpoint.
	 * 
	 * This method handles the delete request, displays appropriate messages, and performs navigation 
	 * upon successful deletion.
	 * @public
	 * @param formData - The FormData object containing the necessary data for deletion.
	 * @param apiEndpoint - The API endpoint to which the delete request will be sent.
	 * @param deleteButton - The button element associated with the delete action, used to manage its disabled state.
	 * @param navigatePath - The path to navigate to after a successful deletion.
	 * @param onSuccess - An optional callback function to execute upon successful deletion.
	 * @returns A promise that resolves once the delete request is processed.
	 */
	public async processDeleteRequest(
		formData: FormData,
		apiEndpoint: string,
		deleteButton: Button,
		navigatePath?: string,
		onSuccess?: (payload?: T | Record<string, unknown> | null) => void
	) {
		try {
			const response = await fetch(apiEndpoint, { 
				method: "POST", 
				body: formData 
			})
			if (!response.ok) {
				const serverErrorResponse = await this.handleServerErrorResponse(response)
				if (typeof serverErrorResponse === "string") {
					Toast({ message: serverErrorResponse })
				}
				this.handleButtonState(false, deleteButton, "Delete")
				return
			}
			if (response.ok) {
				const { message, payload } = await this.handleServerSuccessResponse(response)
				onSuccess?.(payload)
				if (navigatePath) router.navigate(navigatePath)
				Toast({ message: message })
			}
		} catch (error) {
			console.error("There was a problem with the fetch operation:", error)
		}
	}

	/**
	 * Resets the internal store states to their initial empty or default values.
	 * 
	 * This method clears the form data, validation errors, and resets the action 
	 * button to its disabled state. It is typically used to completely clear 
	 * the form's state, preparing it for a new input cycle or after form submission.
	 * @public
	 */
	public resetStoreStates() {
		this.recordsFormData.set({})
		this.formValidationErrors.set({})
		this.actionButtonDisabled.set(true)
	}

}
