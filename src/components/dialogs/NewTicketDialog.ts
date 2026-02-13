import { html } from "lit-html"
import { fetchData } from "@lib/utils.client.ts"
import { pgToDatetimeLocal } from "@utils/utils.ts"
import { selectRenderer } from "@vaadin/select/lit.js"
import { newTicketSchema } from "@schema/ticket.schema.ts"
import { TicketsGrid } from "@components/grids/TicketsGrid.ts"
import { updateRentDurationField } from "@controllers/tickets.ts"
import { ActionDialogBase } from "@base/dialogs/ActionDialogBase.ts"
import type { Select, SelectOpenedChangedEvent } from "@vaadin/select"
import type { Ticket, Location, Customer, Starship } from "../../types.ts"
import type { DateTimePickerValueChangedEvent } from "@vaadin/date-time-picker"

export class NewTicketDialog extends ActionDialogBase<Ticket> {

	#locationList: Location[] | null = null
	#customerList: Customer[] | null = null
	#starshipList: Starship[] | null = null
	#endRentDateTime: string | undefined = undefined
	#startRentDateTime: string | undefined = undefined

	constructor() {
		super("#rentalsMenuBar")
		this.formController.setRenderCallback(() => this.render())
		this.formController.setValidationSchema(newTicketSchema)
	}

	protected getDialogId() {
		return "#newTicket"
	}

	protected getDialogClass() {
		return "new ticket"
	}

	protected getActionButtonSelector() {
		return "vaadin-dialog-overlay.new.ticket #submitNewTicket"
	}

	protected getFormFieldNames(): (keyof Ticket)[] {
		return [
			"customer", "starship", "pickup_location", "return_location",
			"pickup_date", "return_date", "total_cost"
		]
	}

	protected getLocationList = async () => {
		const { tableData, errorMsg } = await fetchData<Location>({
			tableName: "locations",
			query: "id, name"
		})
		this.#locationList = tableData
	}

	protected getCustomerList = async () => {
		const { tableData, errorMsg } = await fetchData<Customer>({
			tableName: "customers",
			query: "id, first_name, last_name"
		})
		this.#customerList = tableData
	}

	protected getStarshipList = async () => {
		const { tableData, errorMsg } = await fetchData<Starship>({
			tableName: "starships",
			query: "id, make, model"
		})
		this.#starshipList = tableData
	}

	protected handleSubmitRecord = async (event: SubmitEvent) => {
		event.preventDefault()
		if (this.formController.localValidationErrors.size > 0) return
		const form = event.currentTarget as HTMLFormElement
		const submitButton = this.formController.getActionButton(
			this.getActionButtonSelector(),
		)
		this.formController.handleButtonState(true, submitButton)
		const formData = new FormData()
		const ticketData = this.formController.recordsFormData.get()
		const formFieldNames = this.getFormFieldNames()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "ticket",
			type: "add",
		})
		const onSuccess = (payload?: Ticket | Record<string, unknown> | null) => {
			const newTicket = payload as Ticket
			if (newTicket) {
				TicketsGrid.getInstance().addTicket(newTicket)
			}
			this.closeDialog()
		}
		this.formController.appendFormFields(
			formData, 
			ticketData, 
			formFieldNames
		)
		await this.formController.processFormSubmission(
			formData,
			apiEndpoint,
			form,
			submitButton,
			onSuccess,
		)
	}

	protected handleLocationChange = (event: InputEvent) => {
		const currentSelect = event.target as Select
		const { name, value } = currentSelect
		this.handleFieldChange(event)
		this.validateLocationDuplication(currentSelect, name!, value)
	}

	protected validateLocationDuplication(currentSelect: Select, fieldName: string, value: string,) {
		const form = currentSelect.closest("form")
		if (!form) return
		const otherLocationSelect = form.querySelector(
			`vaadin-select[name*="location"]:not([name="${fieldName}"])`,
		) as Select
		if (!otherLocationSelect) return
		const formData = this.formController.recordsFormData.get()
		const pickupLocation = formData.pickup_location ?? ""
		const returnLocation = formData.return_location ?? ""
		const isDuplicate =
			value &&
			((fieldName === "pickup_location" && value === returnLocation) ||
				(fieldName === "return_location" && value === pickupLocation))
		const errorMessage = "Pickup and return locations cannot be the same."
		if (isDuplicate) {
			this.setLocationValidationError(currentSelect, errorMessage)
			if (otherLocationSelect.value === currentSelect.value) {
				this.setLocationValidationError(otherLocationSelect, errorMessage)
			}
		} else {
			this.clearLocationValidationError(currentSelect, errorMessage)
			this.clearLocationValidationError(otherLocationSelect, errorMessage)
		}
	}

	protected setLocationValidationError(select: Select, errorMessage: string) {
		const currentErrorMsg = this.formController.formValidationErrors.get()[select.name!]
		select.errorMessage = currentErrorMsg || errorMessage
		select.invalid = !!currentErrorMsg || true
	}

	protected clearLocationValidationError(select: Select, errorMessage: string) {
		if (select.errorMessage === errorMessage) {
			select.errorMessage = ""
			select.invalid = false
		}
	}

	protected pickupDateValueChanged = (event: DateTimePickerValueChangedEvent) => {
		this.#startRentDateTime = event.detail.value
		this.updateRentDuration()
	}

	protected returnDateValueChanged = (event: DateTimePickerValueChangedEvent) => {
		this.#endRentDateTime = event.detail.value
		this.updateRentDuration()
	}

	protected updateRentDuration() {
		if (this.#startRentDateTime && this.#endRentDateTime) {
			const rentDuration = updateRentDurationField(this.#startRentDateTime, this.#endRentDateTime)
			if (rentDuration && !rentDuration.success) {
				this.formController.localValidationErrors.add("rent_duration")
			} else {
				this.formController.localValidationErrors.delete("rent_duration")
			}
		}
	}

	protected loadLocationList = async (event: SelectOpenedChangedEvent) => {
		this.loadSelectedList(event, this.#locationList, this.getLocationList, "#locationListBox")
	}

	protected loadCustomerList = async (event: SelectOpenedChangedEvent) => {
		this.loadSelectedList(event, this.#customerList, this.getCustomerList, "#customerListBox")
	}

	protected loadStarshipList = async (event: SelectOpenedChangedEvent) => {
		this.loadSelectedList(event, this.#starshipList, this.getStarshipList, "#starshipListBox")
	}

	protected locationListRenderer = () => html`
		${this.#locationList
			? html`
					<vaadin-list-box id="locationListBox">
						${this.#locationList?.map(
							(location) => html`
								<vaadin-item value=${location.id} label=${location.name}>
									${location.name}
								</vaadin-item>
							`
						)}
					</vaadin-list-box>
				`
			: this.loadingRenderer()}
	`

	protected customerListRenderer = () => html`
		${this.#customerList
			? html`
					<vaadin-list-box id="customerListBox">
						${this.#customerList?.map(
							(customer) => html`
								<vaadin-item value=${customer.id} label=${customer.first_name + " " + customer.last_name}>
									${customer.first_name + " " + customer.last_name}
								</vaadin-item>
							`
						)}
					</vaadin-list-box>
				`
			: this.loadingRenderer()}
	`

	protected starshipListRenderer = () => html`
		${this.#starshipList
			? html`
					<vaadin-list-box id="starshipListBox">
						${this.#starshipList?.map(
							(starship) => html`
								<vaadin-item value=${starship.id} label=${starship.make + " " + starship.model}>
									${starship.make + " " + starship.model}
								</vaadin-item>
							`
						)}
					</vaadin-list-box>
				`
			: this.loadingRenderer()}
	`

	protected renderHeader = () => html`
		<h2 class="text-l font-bold flex-auto">
			Add new ticket
		</h2>
		<vaadin-button 
			@click=${this.close} 
			theme="icon tertiary contrast">
			<vaadin-icon src="/close.svg"></vaadin-icon>
			<vaadin-tooltip
				slot="tooltip" 
				text="Close">
			</vaadin-tooltip>
		</vaadin-button>
	`

	protected renderDialog = () => html`
		<vaadin-vertical-layout theme="padding" class="pt-0 items-stretch">
			<form 
				@submit=${this.handleSubmitRecord} 
				class="mt-m flex flex-col gap-s">
				<vaadin-select
					@change=${this.handleFieldChange}
					@opened-changed=${this.loadCustomerList}
					.required=${false}
					.manualValidation=${true}
					no-vertical-overlap
					name="customer"
					label="Customer name"
					${selectRenderer(this.customerListRenderer)}>
				</vaadin-select>
				<vaadin-select
					@change=${this.handleFieldChange}
					@opened-changed=${this.loadStarshipList}
					.required=${false}
					.manualValidation=${true}
					no-vertical-overlap
					name="starship"
					label="Starship model"
					${selectRenderer(this.starshipListRenderer)}>
				</vaadin-select>
				<vaadin-select
					@change=${this.handleLocationChange}
					@opened-changed=${this.loadLocationList}
					.required=${false}
					.manualValidation=${true}
					no-vertical-overlap
					name="pickup_location"
					label="Pickup location"
					${selectRenderer(this.locationListRenderer)}>
				</vaadin-select>
				<vaadin-date-time-picker
					@change=${this.handleFieldChange}
					@value-changed=${this.pickupDateValueChanged}
					.min=${pgToDatetimeLocal(new Date().toLocaleDateString())}
					.required=${false}
					.manualValidation=${true}
					auto-open-disabled
					name="pickup_date" 
					label="Start of rental period">
				</vaadin-date-time-picker>
				<vaadin-select
					@change=${this.handleLocationChange}
					@opened-changed=${this.loadLocationList}
					.required=${false}
					.manualValidation=${true}
					no-vertical-overlap
					name="return_location"
					label="Return location"
					${selectRenderer(this.locationListRenderer)}>
				</vaadin-select>
				<vaadin-date-time-picker
					@change=${this.handleFieldChange}
					@value-changed=${this.returnDateValueChanged}
					.min=${pgToDatetimeLocal(new Date().toLocaleDateString())}
					.required=${false}
					.manualValidation=${true}
					auto-open-disabled
					name="return_date" 
					label="End of rental period">
				</vaadin-date-time-picker>
				<vaadin-text-field
					.required=${false}
					.manualValidation=${true}
					.readonly=${true}
					name="rent_duration" 
					label="Rent duration">
				</vaadin-text-field>
				<vaadin-number-field
					@input=${this.handleFieldChange}
					.required=${false}
					.manualValidation=${true}
					name="total_cost" 
					label="Total cost">
				</vaadin-number-field>
				${this.formActionButtonsTemplate({
					formType: "add", 
					submitButtonId: "submitNewTicket"
				})}
			</form>
		</vaadin-vertical-layout>
	`

}
