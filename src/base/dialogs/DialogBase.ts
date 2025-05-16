import { atom } from "nanostores"
import { render } from "lit-html"
import type { Dialog } from "@vaadin/dialog"
import type { TemplateResult } from "lit-html"

/**
 * An abstract base class for managing and rendering dialogs 
 * using the Vaadin Dialog component and `lit-html`.
 *
 * The `DialogBase` class provides methods for implementing 
 * dialog behavior and structure, including rendering dialog headers, 
 * content, and footers. It uses `nanostores` to manage state and 
 * `lit-html` for efficient DOM updates. Subclasses must implement 
 * abstract methods to define specific dialog configurations and content.
 * @abstract
 */
export abstract class DialogBase {

	/** 
	 * Container element where the dialog will be rendered.
	 *  @protected 
	 */
	protected container: HTMLElement | DocumentFragment

	/** 
	 * Instance of the Vaadin Dialog component.
	 * @protected 
	 */
	protected dialog: Dialog | null

	/** 
	 * Nano store for tracking the open state of the dialog.
	 * @protected 
	 */
	protected dialogOpened = atom(false)

	/**
	 * Initializes the `DialogBase` class.
	 * 
	 * This constructor selects the container element for the dialog 
	 * and throws an error if the container is not found, call the
	 * render method and get a instance of the Vaadin Dialog component.
	 * @constructor 
	 * @param containerId The ID of the container where the dialog will be rendered.
	 * @throws {Error} If the container element is not found in the DOM.
	 */
	constructor(containerId: string) {
		this.container = document.querySelector(containerId) as HTMLElement
		if (!this.container) {
			throw new Error("Container not found")
		}
		this.render()
		this.dialog = this.container.querySelector(this.getDialogId())
	}

	/**
	 * Gets the ID of the dialog element.
	 * @protected
	 * @abstract
	 * @returns The string ID of the dialog element.
	 */
	protected abstract getDialogId(): string

	/**
	 * Gets the CSS class of the dialog element.
	 * @protected
	 * @abstract
	 * @returns The string CSS class of the dialog element.
	 */
	protected abstract getDialogClass(): string

	/**
	 * Builds the template for the Vaadin Dialog element.
	 * @abstract
	 * @protected
	 * @returns A lit-html `TemplateResult`.
	 */
	protected abstract template(): TemplateResult

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to define the implementation of rendering the dialog header.
	 * @hook
	 * @protected
	 * @returns The Lit-HTML rendered header template.
	 */
	protected renderHeader(): TemplateResult | undefined {
		return undefined
	}

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to define the implementation of rendering the dialog content.
	 * @hook
	 * @protected
	 * @returns The Lit-HTML rendered dialog template.
	 */
	protected renderDialog(): TemplateResult | undefined {
		return undefined
	}

	/**
	 * This method provides a placeholder in the base class and can be overridden in
	 * subclasses to define the implementation of rendering the dialog footer.
	 * @hook
	 * @protected
	 * @returns The Lit-HTML rendered footer template.
	 */
	protected renderFooter(): TemplateResult | undefined {
		return undefined
	}

	/**
	 * Opens the dialog.
	 * 
	 * Sets the `dialogOpened` nano store to `true` and updates 
	 * the dialog's `opened` property accordingly.
	 * If the dialog element is initialized, it will be displayed.
	 * @public
	 */
	public open() {
		this.dialogOpened.set(true)
		if (this.dialog) {
			this.dialog.opened = this.dialogOpened.get()
		}
	}

	/**
	 * Closes the dialog.
	 * @protected
	 */
	protected closeDialog() {
		this.dialogOpened.set(false)
		if (this.dialog) {
			this.dialog.opened = this.dialogOpened.get()
		}
	}

	/** Renders the dialog component to the DOM.
	 * 
	 * This method is responsible for updating the visual representation of the dialog
	 * based on the current state of the component. It should be called whenever
	 * the dialog's content or state changes and needs to be reflected in the UI.
	 * @protected
	 */
	protected render() {
		render(this.template(), this.container, { host: this })
	}

}
