import { html, nothing } from "lit-html"
import { Badge } from "@components/Badge.ts"
import { popoverRenderer } from "@vaadin/popover/lit.js"
import { observeAndRender } from "@utils/observe-and-render.ts"
import type { Checkbox } from "@vaadin/checkbox"
import type { SearchBarOptions } from "../types.ts"
import type { TextFieldValueChangedEvent } from "@vaadin/text-field"

/**
 * A reusable search bar component with optional features like:
 * - Search input field
 * - Select-all checkbox
 * - Filter button with counter badge
 * - Custom popover content
 * 
 * @example
 * const searchBar = new SearchBar({
 *   selector: '#search-container',
 *   placeholder: 'Find items...',
 *   checkbox: true,
 *   filterButton: true,
 *   onSearch: (term) => console.log('Searching for:', term)
 * });
 */
export class SearchBar {
	
	/**
	 * The configuration options for this search bar instance.
	 * @protected
	 */
	protected options: SearchBarOptions

	/**
	 * Creates a new SearchBar instance.
	 * @constructor
	 * @param options - Configuration options for the search bar.
	 */
	constructor(options: SearchBarOptions) {
		this.options = {
			placeholder: "Search",
			...options,
		}
		this.render()
	}

	/**
	 * Handles the select-all checkbox change event.
	 * @protected
	 * @param event - The input change event.
	 */
	protected handleSelectAll = (event: InputEvent) => {
		const checkbox = event.currentTarget as Checkbox
		this.options.onSelectAll?.(checkbox.checked)
	}

	/**
	 * Handles the search input value change event.
	 * @protected
	 * @param event - The text field value changed event.
	 */
	protected handleSearchValueChanged = (event: TextFieldValueChangedEvent) => {
		const searchTerm = (event.detail.value || "").trim()
		this.options.onSearch?.(searchTerm)
	}

	/**
	 * Updates the search bar options and re-renders the component.
	 * @public
	 * @param newOptions - New options to merge with existing ones.
	 */
	public updateOptions(newOptions: Partial<SearchBarOptions>) {
		this.options = { ...this.options, ...newOptions }
		this.render()
	}

	/**
	 * Creates a badge component for the filter counter.
	 * @protected
	 * @returns The badge template.
	 */
	protected filterCounterBadge() {
		const counter = this.options.filterCounter
		return Badge({
			text: counter?.toString(),
			theme: "small contrast pill",
			slot: "suffix",
			className: "border border-contrast-80",
		})
	}

	/**
	 * Creates the template for the select-all checkbox.
	 * @protected
	 * @returns The checkbox template.
	 */
	protected checkboxTemplate() {
		return html`
			<vaadin-checkbox @change=${this.handleSelectAll} aria-label="Select all">
				<vaadin-tooltip slot="tooltip" text="Select all"> </vaadin-tooltip>
			</vaadin-checkbox>
		`
	}

	/**
	 * Creates the template for the filter button and popover.
	 * @protected
	 * @returns The filter button template.
	 */
	protected filterButtonTemplate() {
		return html`
			<vaadin-button id="target" theme="outline" class="text-body">
				<vaadin-icon slot="prefix" src="/filter.svg"> </vaadin-icon>
				Filters
				${this.options.filterCounter ? this.filterCounterBadge() : nothing}
			</vaadin-button>
			${this.options.popoverTemplate
				? html`
						<vaadin-popover
							${popoverRenderer(this.options.popoverTemplate)}
							for="target"
							position="bottom-end"
						>
						</vaadin-popover>
					`
				: nothing}
		`
	}

	/**
	 * Creates the main template for the search bar component.
	 * @protected
	 * @returns The search bar template.
	 */
	protected template() {
		return html`
			<div id="searchBar" class="flex items-center w-full ps-s gap-s box-border">
				${this.options.checkbox && this.checkboxTemplate()}
				<vaadin-text-field
					@value-changed=${this.handleSearchValueChanged}
					.clearButtonVisible=${true}
					class="flex w-full flex-auto min-w-0"
					placeholder=${this.options.placeholder}
				>
				</vaadin-text-field>
				${this.options.filterButton && this.filterButtonTemplate()}
			</div>
		`
	}

	/**
	 * Renders the search bar in the DOM.
	 * @public
	 */
	public render() {
		observeAndRender({
			template: this.template(),
			targetSelector: this.options.selector,
		})
	}
}
