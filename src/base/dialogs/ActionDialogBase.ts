import { Forms } from "@controllers/forms.ts"
import { html, render, nothing } from "lit-html"
import { DialogBase } from "@base/dialogs/DialogBase.ts"
import { userDataStore } from "@store/userData.store.ts"
import { ConfirmDialog } from "@components/dialogs/ConfirmDialog.ts"
import { dialogHeaderRenderer, dialogRenderer } from "@vaadin/dialog/lit.js"
import type { Avatar } from "@vaadin/avatar"
import type { Button } from "@vaadin/button"
import type { 
	SelectConfig, 
	RemoveConfig, 
	AvatarTemplateConfig, 
	HeroTemplateConfig, 
	ValidationErrorConfig, 
	FormImagesTemplateConfig, 
	ActionButtonsTemplateConfig 
} from "../../types.ts"
import "@styles/action-dialogs.css"

/**
 * Base class for action dialogs that manage form submissions and image uploads.
 * 
 * This class extends the `DialogBase` class and provides the functionality 
 * for rendering, validating, and submitting a form within a dialog. It also 
 * handles image selection, removal, and validation. The form state is managed 
 * by an instance of the `Forms` class, and the dialog is controlled through 
 * the `DialogBase` methods.
 * @template T - The type of the form data that the dialog will manage.
 * @abstract
 * @extends {DialogBase}
 */
export abstract class ActionDialogBase<T extends { [key: string]: any }> extends DialogBase {

	/**
	 * An instance of the `Forms` class used to manage the form data
	 * and validation logic for the dialog. This instance is recreated
	 * each time the dialog is opened to ensure a fresh state.
	 * @protected
	 */
	protected formController: Forms<T>

	/**
	 * Stores the data of the currently logged-in user, retrieved from the user data store.
	 * @protected
	 */
	protected loggedInUserData = userDataStore.get()

	/**
	 * Creates an instance of the `ActionDialogBase` class.
	 *
	 * This constructor initializes the base dialog functionality 
	 * by invoking  the parent class constructor with the given  
	 * `containerId`. Additionally, it creates a new instance of the
	 * `Forms` class to manage form data and validation logic for the dialog.
	 * @constructor 
	 * @param containerId - The ID of the container where the dialog will be rendered.
	 */
	constructor(containerId: string) {
		super(containerId)
		this.formController = new Forms<T>()
	}

	/**
	 * Gets a provided CSS selector that identifies the action button on the form.
	 * @protected
	 * @abstract
	 * @returns A string CSS selector of the action button element in the form.
	 */
	protected abstract getActionButtonSelector(): string

	/**
	 * Gets an array of provided form field names.
	 * @protected
	 * @abstract
	 * @param fieldType - The type of field (e.g., "file").
	 * @returns An array of field names.
	 */
	protected abstract getFormFieldNames(fieldType?: string): (keyof T)[]

	/**
	 * Handles the form submit process.
	 * @protected
	 * @abstract
	 * @param event - The submit event.
	 * @returns A promise that resolves when the submission is handled.
	 */
	protected abstract handleSubmitRecord(event: SubmitEvent): Promise<void>

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to handles the deleted process.
	 * @hook
	 * @protected
	 * @param event - The click event.
	 * @returns A promise that resolves when the submission is handled.
	 */
	protected handleDeleteRecord(event: MouseEvent): Promise<void> | undefined {
		return undefined
	}

	/**
	 * Opens the dialog and sets the form's edit mode 
	 * based on the dialog's ID.
	 * 
	 * Calls the parent class's `open` method to handle the base
	 * dialog opening logic, determines if the dialog is in edit
	 * mode and sets the form controller's edit mode accordingly.
	 * @public
	 */
	public open() {
		super.open()
		const isEdit = this.getDialogId().includes("edit")
		this.formController.setEditMode(isEdit)
	}

	/**
	 * Closes the dialog after checking for unsaved changes.
	 * 
	 * If there are unsaved changes, prompts the user with a 
	 * confirmation dialog to either discard or keep them.
	 * If the user confirms the discard, the dialog will 
	 * be closed. Otherwise, it remains open.
	 * @protected
	 * @returns A promise that resolves if the dialog is successfully 
	 * closed or if the user cancels the confirmation.
	 */
	protected async close() {
		const unsavedChanges = this.formController.handleUnsavedChanges()
		if (unsavedChanges) {
			const result = await ConfirmDialog({
				header: "Unsaved changes",
				message: "There are unsaved changes in this dialog. Are you sure you want to close it? Your changes will be lost.",
				confirmText: "Discard",
				confirmTheme: "primary"
			})
			if (result === "confirm") {
				this.closeDialog()
			}
		} else {
			this.closeDialog()
		}
	}

	/**
	 * Closes the dialog, resets stores state and remove the 
	 * dialog element by rendering `nothing` in the container.
	 * @protected
	 */
	protected closeDialog() {
		this.dialogOpened.set(false)
		if (this.dialog) {
			this.dialog.opened = this.dialogOpened.get()
			this.formController.resetStoreStates()
			render(nothing, this.container)
		}
	}

	/**
	 * Handles input field changes and updates the associated `Forms` instance.
	 *
	 * This method acts as an intermediary to delegate input field change events 
	 * to the `handleFieldChange` method of the `Forms` instance (`formController`). 
	 * It ensures that changes made in the dialog's input fields are correctly 
	 * reflected in the current instance of `Forms`, even when the dialog is reopened 
	 * and a new `formController` instance is created.
	 * @protected
	 * @param event - The input event triggered by the field change. 
	 */
	protected handleFieldChange(event: InputEvent) {
		this.formController.handleFieldChange(event)
	}

	/**
	 * Opens the file input dialog to select an image (either avatar or hero).
	 * 
	 * This method triggers a click event on the appropriate file input element 
	 * based on the button that was clicked. The method determines which input 
	 * element to open by checking the ID of the button clicked (`addAvatarImage` 
	 * or `addHeroImage`), and then it clicks the corresponding input field to 
	 * allow the user to select an image file.
	 * @protected
	 * @param event - The mouse click event triggered by the user clicking 
	 * the "add" image button (either for avatar or hero).
	 */
	protected openSelectImage(event: MouseEvent) {
		const target = event.currentTarget as Button
		const form = target.closest("form")
		if (!form) return
		const inputId = target.id === "addAvatarImage" ? "#avatarInput" : "#heroInput"
		const inputFile = form.querySelector<HTMLInputElement>(inputId)
		if (inputFile) inputFile.click()
	}

	/**
	 * Handles the image selection from the file input.
	 * 
	 * This method is triggered when the user selects an image file through 
	 * the file input. It processes the selected file, updates the form data 
	 * with the new image, and sets the corresponding image preview. If validation 
	 * errors are present, the method displays the error messages next to the 
	 * image input fields. It also enables or disables the action buttons 
	 * depending on the form validation state.
	 * @protected
	 * @param event - The change event triggered when the user selects an image 
	 * file from the input field.
	 */
	protected handleSelectImage(event: Event) {
		const inputFile = event.currentTarget as HTMLInputElement
		const form = inputFile.closest("form")
		if (!form) return
		const imageType = inputFile.id.replace("Input", "")
		const config: SelectConfig = {
			avatar: {
				removeId: "#removeAvatarImage",
				errorId: "#avatarValidationError",
				imageContainer: "vaadin-avatar",
				setImage: (element, imageUrl) => {
					element.img = imageUrl
				}
			},
			hero: {
				removeId: "#removeHeroImage",
				errorId: "#heroValidationError",
				imageContainer: "#heroContainer",
				setImage: (element, imageUrl) => {
					element.style.setProperty("--hero-image", `url(${imageUrl})`)
				}
			}
		}
		const currentConfig = config[imageType as keyof typeof config]
		if (!currentConfig) return
		const removeButton = form.querySelector<Button>(currentConfig.removeId)
		const validationError = form.querySelector<HTMLSpanElement>(currentConfig.errorId)
		const imageElement = form.querySelector<Avatar & HTMLDivElement>(currentConfig.imageContainer)
		if (inputFile && inputFile.files && inputFile.files.length > 0) {
			const file = inputFile.files[0]
			if (file) {
				const oldValues = this.formController.recordsFormData.get()
				this.formController.recordsFormData.set({ 
					...oldValues, 
					[inputFile.name]: file
				})
				const imageUrl = URL.createObjectURL(file)
				if (imageElement) {
					currentConfig.setImage(imageElement, imageUrl)
				}
			}
		}
		if (validationError) this.removeValidationError(validationError)
		const clientValidationResponse = this.formController.validateFormData(
			this.formController.recordsFormData.get()
		)
		if (clientValidationResponse) {
			this.formController.handleFormValidationErrors(clientValidationResponse)
			if (validationError && this.formController.formValidationErrors.get()[inputFile.name]) {
				validationError.innerText = this.formController.formValidationErrors.get()[inputFile.name]
				validationError.parentElement?.classList.remove("hidden")
				validationError.parentElement?.classList.add("block")
			}
		}
		if (removeButton) removeButton.removeAttribute("hidden")
		this.formController.enableActionButton()
	}

	/**
	 * Handles the removal of an image.
	 * 
	 * This method is triggered when the user clicks the remove button for
	 * either the avatar or hero image. It clears the corresponding image input
	 * field, update or delete the `recordsFormData` key based on whether it is
	 * an edit dialog or not. The method also resets the image preview, handles the 
	 * removal of any validation errors and updates the visibility of the 
	 * remove button accordingly. Finally, it enables or disables the action 
	 * buttons based on the current form state.
	 * @protected
	 * @param event - The click event triggered when the user clicks the remove 
	 * button for the image.
	 */
	protected handleRemoveImage(event: MouseEvent) {
		const target = event.currentTarget as Button
		const form = target.closest("form")
		if (!form) return
		const imageType = target.id.replace("remove", "").replace("Image", "").toLowerCase()
		const config: RemoveConfig = {
			avatar: {
				inputId: "#avatarInput",
				errorId: "#avatarValidationError",
				imageContainer: "vaadin-avatar",
				clearImage: (element) => element.img = ""
			},
			hero: {
				inputId: "#heroInput",
				errorId: "#heroValidationError",
				imageContainer: "#heroContainer",
				clearImage: (element) => element.style.removeProperty("--hero-image")
			}
		}
		const currentConfig = config[imageType as keyof typeof config]
		if (!currentConfig) return
		const inputFile = form.querySelector<HTMLInputElement>(currentConfig.inputId)
		const validationError = form.querySelector<HTMLSpanElement>(currentConfig.errorId)
		const imageElement = form.querySelector<Avatar & HTMLDivElement>(currentConfig.imageContainer)
		if (inputFile) {
			inputFile.value = ""
			const keyValue = this.getDialogId().includes("edit") ? "" : undefined
			// @ts-ignore
			this.formController.recordsFormData.setKey(inputFile.name, keyValue)
		}
		if (imageElement) {
			currentConfig.clearImage(imageElement)
		}
		if (validationError) {
			this.removeValidationError(validationError)
		}
		target.setAttribute("hidden", "")
		this.formController.enableActionButton()
	}

	/**
	 * Removes the error message associated with the avatar input field.
	 * 
	 * If the error message is currently displayed, it clears the message 
	 * and updates the CSS classes to hide the error state.
	 * @protected
	 * @param avatarTextError - The span element displaying the avatar error message.
	 */
	protected removeValidationError(validationError: HTMLSpanElement) {
		if (validationError.parentElement?.classList.contains("block")) {
			validationError.innerText = ""
			validationError.parentElement?.classList.remove("block")
			validationError.parentElement?.classList.add("hidden")
		}
	}

	/**
	 * Displays a confirmation dialog before proceeding with a delete action.
	 * 
	 * The method shows a confirmation dialog with the provided header, message, and button text.
	 * The theme of the confirm button can be customized (default is "error").
	 * Returns the result of the confirmation dialog.
	 * @protected
	 * @async
	 * @param header - The title of the confirmation dialog.
	 * @param message - The message displayed in the confirmation dialog.
	 * @param confirmText - The text displayed on the confirm button (default: "Delete").
	 * @param confirmTheme - The theme of the confirm button (default: "error").
	 * @returns A promise that resolves to the result of the confirmation dialog.
	 */
	protected async confirmDelete(
		header: string,
		message: string,
		confirmText: string = "Delete",
		confirmTheme: string = "error"
	) {
		const result = await ConfirmDialog({ header, message, confirmText, confirmTheme })
		return result
	}

	/**
	 * Renders the avatar image section with controls.
	 * @protected
	 * @param config - Configuration for avatar image elements
	 * @returns Template with avatar image UI
	 */
	protected renderAvatarSection(config: AvatarTemplateConfig<T>) {
		const { recordDetails, fieldName, imageUrl } = config
		return html`
			<vaadin-avatar .img=${imageUrl || nothing}></vaadin-avatar>
			<vaadin-button 
				@click=${this.openSelectImage} 
				id="addAvatarImage" 
				theme="small icon">
				<vaadin-icon src="/camera-plus.svg"></vaadin-icon>
				<vaadin-tooltip slot="tooltip" text="Add avatar image"></vaadin-tooltip>
			</vaadin-button>
			<vaadin-button
				@click=${this.handleRemoveImage}
				.hidden=${recordDetails ? (recordDetails[fieldName] ? false : true) : true}
				id="removeAvatarImage"
				theme="small icon tertiary contrast">
				<vaadin-icon src="/trash.svg"></vaadin-icon>
				<vaadin-tooltip
					slot="tooltip"
					position="end-bottom" 
					text="Remove avatar image">
				</vaadin-tooltip>
			</vaadin-button>
			<input 
				@change=${this.handleSelectImage}
				id="avatarInput" 
				name=${fieldName}
				type="file" 
				accept="image/*" 
				hidden 
			/>
		`
	}

	/**
	 * Renders the hero image section with controls.
	 * @protected
	 * @param config - Configuration for hero image elements
	 * @returns Template with hero image UI
	 */
	protected renderHeroSection(config: HeroTemplateConfig<T>) {
		const { recordDetails, fieldName, imageUrl, includeAvatar } = config
		return html`
			<div 
				id="heroContainer" 
				class="flex flex-col w-full"
				style="--hero-image: url(${imageUrl || nothing})">
				<div class="flex hero mb-xl pt-xl relative">
					<vaadin-button 
						@click=${this.openSelectImage} 
						id="addHeroImage" 
						theme="small icon">
						<vaadin-icon src="/camera-plus.svg"></vaadin-icon>
						<vaadin-tooltip slot="tooltip" text="Add hero image"></vaadin-tooltip>
					</vaadin-button>
					<vaadin-button
						@click=${this.handleRemoveImage}
						.hidden=${recordDetails ? (recordDetails[fieldName] ? false : true) : true}
						id="removeHeroImage"
						theme="small icon tertiary contrast">
						<vaadin-icon src="/trash.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip"
							position="start-bottom" 
							text="Remove hero image">
						</vaadin-tooltip>
					</vaadin-button>
					<input 
						@change=${this.handleSelectImage}
						id="heroInput" 
						name=${fieldName}
						type="file" 
						accept="image/*" 
						hidden 
					/>
					${includeAvatar ? html`
						<div id="avatarContainer" class="relative">
							${this.renderAvatarSection({
								recordDetails,
								fieldName: includeAvatar.fieldName,
								imageUrl: includeAvatar.imageUrl
							})}
						</div>
					` : nothing}
				</div>
			</div>
		`
	}

	/**
	 * Renders validation error messages for specified fields.
	 * @protected
	 * @param config - Configuration for error messages
	 * @returns Template with validation errors UI
	 */
	protected renderValidationErrors(config: ValidationErrorConfig) {
		return html`
			<div id="validationErrorContainer" class="w-full flex flex-col">
				${config.avatarField ? html`
					<fieldset class="hidden m-auto border border-error rounded-s">
						<legend>Avatar</legend>
						<span 
							id="avatarValidationError" 
							class="block text-center text-xs text-error whitespace-pre-line">
						</span>
					</fieldset>
				` : nothing}
				${config.heroField ? html`
					<fieldset class="hidden m-auto border border-error rounded-s">
						<legend>Hero</legend>
						<span 
							id="heroValidationError" 
							class="block text-center text-xs text-error whitespace-pre-line">
						</span>
					</fieldset>
				` : nothing}
			</div>
		`
	}

	/**
	 * Generates appropriate image templates based on form configuration.
	 * @protected
	 * @param config - Form images configuration
	 * @returns Template with combined image sections
	 */
	protected formImagesTemplate(config: FormImagesTemplateConfig<T>) {
		const { formType, recordDetails, avatar, hero } = config
		if (formType === 'add' && avatar) {
			return html`
				<div class="relative flex">
					${this.renderAvatarSection({
						recordDetails,
						fieldName: avatar.fieldName,
						imageUrl: avatar.imageUrl || ''
					})}
				</div>
				${this.renderValidationErrors({ avatarField: avatar.fieldName })}
			`
		}
		if (formType === 'edit' && hero) {
			if (avatar) {
				return html`
					${this.renderHeroSection({
						recordDetails,
						fieldName: hero.fieldName,
						imageUrl: hero.imageUrl || '',
						includeAvatar: {
							fieldName: avatar.fieldName,
							imageUrl: avatar.imageUrl || ''
						}
					})}
					${this.renderValidationErrors({
						avatarField: avatar.fieldName,
						heroField: hero.fieldName
					})}
				`
			}
			return html`
				${this.renderHeroSection({
					recordDetails,
					fieldName: hero.fieldName,
					imageUrl: hero.imageUrl || ''
				})}
				${this.renderValidationErrors({ heroField: hero.fieldName })}
			`
		}
		return nothing
	}

	/**
	 * Generates the template for form action buttons based on the form type.
	 * @protected
	 * @param config - The configuration object specifying the form type and submit button ID.
	 * @returns A template containing the appropriate action buttons.
	 */
	protected formActionButtonsTemplate(config: ActionButtonsTemplateConfig) {
		const { formType, submitButtonId } = config
		const loggedInUserRole = this.loggedInUserData?.role
		if (formType === "add") {
			return html`
				<vaadin-button
					?disabled=${this.formController.disabledButton.get()}
					@click=${this.formController.handleActionButtonClick}
					id=${submitButtonId}
					class="mt-m" 
					theme="primary">
					Submit
				</vaadin-button>
				<input 
					?disabled=${this.formController.disabledButton.get()} 
					type="submit" 
					hidden 
				/>
			`
		} else if (formType === "edit") {
			return html`
				<div class="flex items-center justify-between w-full gap-m">
					${
						loggedInUserRole === "admin"
						? html`
							<vaadin-button
								@click=${this.handleDeleteRecord}
								class="mr-auto" 
								theme="error">
								Delete
							</vaadin-button>
						`
						: nothing
					}
					<vaadin-button
						@click=${this.close}
						class=${loggedInUserRole !== "admin" && "ml-auto"} 
						theme="contrast">
						Cancel
					</vaadin-button>
					<vaadin-button
						?disabled=${this.formController.disabledButton.get()} 
						@click=${this.formController.handleActionButtonClick} 
						id=${submitButtonId} 
						theme="primary">
						Save
					</vaadin-button>
					<input 
						?disabled=${this.formController.disabledButton.get()} 
						type="submit" 
						hidden 
					/>
				</div>
			`
		}
	}

	protected template() { 
		return html`
			<vaadin-dialog
				.noCloseOnEsc=${true}
				.noCloseOnOutsideClick=${true}
				.overlayClass=${this.getDialogClass()}
				${dialogHeaderRenderer(() => this.renderHeader()!)}
				${dialogRenderer(() => this.renderDialog()!, [this.formController?.disabledButton.get()])}
				id=${this.getDialogId().slice(1)} 
				theme="no-padding">
			</vaadin-dialog>
		`
	}

}
