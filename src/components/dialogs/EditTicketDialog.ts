import { html } from "lit-html"
import { fetchData } from "@lib/utils.client.ts"
import { pgToDatetimeLocal } from "@utils/utils.ts"
import { selectRenderer } from "@vaadin/select/lit.js"
import { editTicketSchema } from "@schema/ticket.schema.ts"
import { TicketsGrid } from "@components/grids/TicketsGrid.ts"
import { updateRentDurationField } from "@controllers/tickets.ts"
import { TicketDetails } from "@components/panels/TicketDetails.ts"
import { ActionDialogBase } from "@base/dialogs/ActionDialogBase.ts"
import type { Button } from "@vaadin/button"
import type { Ticket, Location, Starship } from "../../types.ts"
import type { Select, SelectOpenedChangedEvent } from "@vaadin/select"
import type { DateTimePickerValueChangedEvent } from "@vaadin/date-time-picker"

export class EditTicketDialog extends ActionDialogBase<Ticket> {

	protected ticketDetailsInstance: TicketDetails
	protected ticketDetailsData: Ticket
	#starshipList: Starship[] | null = null
	#locationList: Location[] | null = null
	#endRentDateTime: string | undefined = undefined
	#startRentDateTime: string | undefined = undefined

	constructor() {
		super("#editTicketButton")
		this.formController.setRenderCallback(() => this.render())
		this.formController.setValidationSchema(editTicketSchema)
		this.ticketDetailsInstance = this.getTicketDetailsInstance()
		this.ticketDetailsData = this.getTicketDetailsData()
	}

	protected getDialogId() {
		return "#editTicket"
	}

	protected getDialogClass() {
		return "edit ticket"
	}

	protected getActionButtonSelector() {
		return "vaadin-dialog-overlay.edit.ticket #saveEditedTicket"
	}

	protected getFormFieldNames(fieldType?: string): (keyof Ticket)[] {
		return [
			"starship", "return_location", "return_date", "total_cost"
		]
	}

	protected getTicketDetailsInstance() {
		const instance = TicketDetails.getInstance({ skipInitialization: true })
		if (!instance) {
			throw new Error("Ticket details instance not found")
		}
		return instance
	}

	protected getTicketDetailsData() {
		const data = this.ticketDetailsInstance.getData()
		if (!data) {
			throw new Error("No ticket details available")
		}
		return data
	}

	protected getStarshipList = async () => {
		const { tableData, errorMsg } = await fetchData<Starship>({
			tableName: "starships",
			query: "id, make, model"
		})
		this.#starshipList = tableData
	}

	protected getLocationList = async () => {
		const { tableData, errorMsg } = await fetchData<Location>({
			tableName: "locations",
			query: "id, name"
		})
		this.#locationList = tableData
	}

	protected handleSubmitRecord = async (event: SubmitEvent) => {
		event.preventDefault()
		if (this.formController.localValidationErrors.size > 0) return
		const form = event.currentTarget as HTMLFormElement
		const saveButton = this.formController.getActionButton(
			this.getActionButtonSelector()
		)
		this.formController.handleButtonState(true, saveButton)
		const formData = new FormData()
		const ticketData = this.formController.recordsFormData.get()
		const formFieldNames = this.getFormFieldNames()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "ticket", 
			type: "edit"
		})
		const onSuccess = (payload?: Ticket | Record<string, unknown> | null) => {
			const editedTicket = payload as Ticket
			if (editedTicket) {
				TicketsGrid.getInstance().editTicket(editedTicket)
				this.ticketDetailsInstance.updateTicketDetails(editedTicket)
			}
			this.closeDialog()
		}
		const ticketId = this.ticketDetailsData.id
		formData.append("id", ticketId)
		this.formController.appendFormFields(
			formData, 
			ticketData, 
			formFieldNames
		)
		const pickupDate = pgToDatetimeLocal(this.ticketDetailsData.pickup_date)
		if (formData.has("return_date")) {
			formData.append("pickup_date", pickupDate)
		}
		await this.formController.processFormSubmission(
			formData, 
			apiEndpoint, 
			form, 
			saveButton, 
			onSuccess
		)
	}

	protected handleDeleteRecord = async (event: MouseEvent) => {
		const deleteButton = event.currentTarget as Button
		const formData = new FormData()
		const apiEndpoint = this.formController.getApiEndpoint({
			name: "ticket", 
			type: "delete"
		})
		const onSuccess = (payload?: Ticket | Record<string, unknown> | null) => {
			const deletedTicket = payload as Ticket
			if (deletedTicket) {
				TicketsGrid.getInstance().deleteTicket(deletedTicket)
				if (this.ticketDetailsData.id === deletedTicket.id) {
					this.ticketDetailsInstance.closeDetails()
				}
			}
			this.closeDialog()
		}
		const result = await this.confirmDelete(
			"Delete ticket",
			"Are you sure you want to delete this ticket? This action cannot be undone."
		)
		if (result === "confirm") {
			this.formController.handleButtonState(true, deleteButton)
			const deleteRequest = this.formController.prepareDeleteFormData(
				formData, 
				this.ticketDetailsData
			)
			await this.formController.processDeleteRequest(
				deleteRequest,
				apiEndpoint,
				deleteButton,
				undefined,
				onSuccess
			)
		}
	}

	protected handleLocationChange = (event: InputEvent) => {
		const currentSelect = event.target as Select
		const { name, value } = currentSelect
		this.handleFieldChange(event)
		const form = currentSelect.closest("form")
		if (!form) return
		const pickupLocationSelect = form.querySelector(
			"vaadin-select[name='pickup_location']",
		) as Select
		if (!pickupLocationSelect) return
		const pickupLocation = pickupLocationSelect.value ?? ""
		const isDuplicate = value && (name === "return_location" && value === pickupLocation)
		const errorMessage = "Return location cannot be the same of pickup location."
		if (isDuplicate) {
			currentSelect.errorMessage = errorMessage
			currentSelect.invalid = true
			this.formController.localValidationErrors.add(name)
		} else {
			currentSelect.errorMessage = ""
			currentSelect.invalid = false
			this.formController.localValidationErrors.delete(name!)
		}
	}

	protected returnDateValueChanged = (event: DateTimePickerValueChangedEvent) => {
		this.#endRentDateTime = event.detail.value
		const rentDuration = updateRentDurationField(this.#startRentDateTime, this.#endRentDateTime)
		if (rentDuration && !rentDuration.success) {
			this.formController.localValidationErrors.add("rent_duration")
		} else {
			this.formController.localValidationErrors.delete("rent_duration")
		}
	}

	protected loadStarshipList = async (event: SelectOpenedChangedEvent) => {
		this.loadSelectedList(event, this.#starshipList, this.getStarshipList, "#starshipListBox")
	}

	protected loadLocationList = async (event: SelectOpenedChangedEvent) => {
		this.loadSelectedList(event, this.#locationList, this.getLocationList, "#locationListBox")
	}

	protected starshipListRenderer = () => {
		if (!this.ticketDetailsData) return this.loadingRenderer("w-full")
		if (!this.#starshipList) {
			return html`
				<vaadin-list-box id="starshipListBox">
					<vaadin-item 
						?selected=${true}
						value=${this.ticketDetailsData.starship.id} 
						label=${this.ticketDetailsData.starship.make + " " + this.ticketDetailsData.starship.model}>
						${this.ticketDetailsData.starship.make + " " + this.ticketDetailsData.starship.model}
					</vaadin-item>
					<vaadin-item disabled>
						${this.loadingRenderer("w-full")}
					</vaadin-item>
				</vaadin-list-box>
			`
		}
		return html`
			<vaadin-list-box id="starshipListBox">
				${this.#starshipList.map(
					(starship) => html`
						<vaadin-item
							?selected=${starship.id === this.ticketDetailsData.starship.id}
							value=${starship.id} 
							label=${starship.make + " " + starship.model}> 
							${starship.make + " " + starship.model}
						</vaadin-item>
					`
				)}
			</vaadin-list-box>
		`
	}

	protected locationListRenderer = () => {
		if (!this.ticketDetailsData) return this.loadingRenderer("w-full")
		if (!this.#locationList) {
			return html`
				<vaadin-list-box id="locationListBox">
					<vaadin-item 
						?selected=${true}
						value=${this.ticketDetailsData.return_location.id} 
						label=${this.ticketDetailsData.return_location.name}>
						${this.ticketDetailsData.return_location.name}
					</vaadin-item>
					<vaadin-item disabled>
						${this.loadingRenderer("w-full")}
					</vaadin-item>
				</vaadin-list-box>
			`
		}
		return html`
			<vaadin-list-box id="locationListBox">
				${this.#locationList.map(
					(location) => html`
						<vaadin-item
							?selected=${location.id === this.ticketDetailsData.return_location.id}
							value=${location.id} 
							label=${location.name}> 
							${location.name}
						</vaadin-item>
					`
				)}
			</vaadin-list-box>
		`
	}

	protected renderHeader = () => html`
		<h2 class="pt-s pb-s text-l font-bold flex-auto">
			Edit ticket details
		</h2>
	`

	protected renderDialog = () => {
		const { customer, starship } = this.ticketDetailsData
		const customerFullName = customer.first_name + " " + customer.last_name
		const pickupDate = pgToDatetimeLocal(this.ticketDetailsData.pickup_date)
		const returnDate = pgToDatetimeLocal(this.ticketDetailsData.return_date)
		this.#startRentDateTime = this.ticketDetailsData.pickup_date
		const pickupLocationItem = () => [{ 
			label: this.ticketDetailsData.pickup_location.name, 
			value: this.ticketDetailsData.pickup_location.id 
		}]
		return html`
			<vaadin-horizontal-layout theme="padding">
				<form 
					@submit=${this.handleSubmitRecord} 
					class="w-full grid grid-cols-5 gap-x-m gap-y-m">
					<vaadin-text-field
						.value=${customerFullName}
						.readonly=${true}
						.required=${true}
						.manualValidation=${true}
						class="col-span-2"
						name="customer"
						label="Customer name">
					</vaadin-text-field>
					<vaadin-select
						@change=${this.handleFieldChange}
						@opened-changed=${this.loadStarshipList}
						.value=${starship.id}
						.required=${true}
						.manualValidation=${true}
						no-vertical-overlap
						class="col-span-3"
						name="starship"
						label="Starship model"
						${selectRenderer(this.starshipListRenderer)}>
					</vaadin-select>
					<vaadin-select
						.value=${this.ticketDetailsData.pickup_location.id}
						.items=${pickupLocationItem()}
						.readonly=${true}
						.required=${true}
						.manualValidation=${true}
						class="col-span-3"
						name="pickup_location"
						label="Pickup location">
					</vaadin-select>
					<vaadin-date-time-picker
						.value=${pickupDate}
						.readonly=${true}
						.required=${true}
						.manualValidation=${true}
						auto-open-disabled
						class="pt-0 col-span-2" 
						name="pickup_date" 
						label="Start of rental period">
					</vaadin-date-time-picker>
					<vaadin-select
						@change=${this.handleLocationChange}
						@opened-changed=${this.loadLocationList}
						.value=${this.ticketDetailsData.return_location.id} 
						.required=${true}
						.manualValidation=${true}
						no-vertical-overlap
						class="col-span-3"
						name="return_location"
						label="Return location"
						${selectRenderer(this.locationListRenderer)}>
					</vaadin-select>
					<vaadin-date-time-picker
						@change=${this.handleFieldChange}
						@value-changed=${this.returnDateValueChanged}
						.value=${returnDate}
						.required=${true}
						.manualValidation=${true}
						auto-open-disabled
						class="pt-0 col-span-2"
						name="return_date" 
						label="End of rental period">
					</vaadin-date-time-picker>
					<vaadin-text-field
						.value=${this.ticketDetailsData.rent_duration}
						.required=${true}
						.manualValidation=${true}
						.readonly=${true}
						class="col-span-3"
						name="rent_duration" 
						label="Rent duration">
					</vaadin-text-field>
					<vaadin-number-field
						@input=${this.handleFieldChange}
						.value=${this.ticketDetailsData.total_cost}
						.required=${true}
						.manualValidation=${true}
						class="col-span-2"
						name="total_cost" 
						label="Total cost">
					</vaadin-number-field>
					${this.formActionButtonsTemplate({
						formType: "edit", 
						submitButtonId: "saveEditedTicket",
						editContainerClassName: "col-span-full"
					})}
				</form>
			</vaadin-horizontal-layout>
		`
	}

}
