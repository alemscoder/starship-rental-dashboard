import router from "@router/router.ts"
import { html, nothing } from "lit-html"
import { Badge } from "@components/Badge.ts"
import { Toast } from "@components/Toast.ts"
import { downloadFile } from "@lib/utils.client.ts"
import { DetailsBase } from "@base/panel/DetailsBase.ts"
import { HeaderSection } from "@sections/HeaderSection.ts"
import { MessagesGrid } from "@components/grids/MessagesGrid.ts"
import { EmployeesGrid } from "@components/grids/EmployeesGrid.ts"
import { SettingsSideNav } from "@pages/settings/SettingsSideNav.ts"
import { processStatusBadge, convertDateTime } from "@utils/utils.ts"
import { employeesStore, messagesStore } from "@store/gridData.store.ts"
import { profileAvatarStore, profileHeroStore } from "@store/fileUrl.store.ts"
import type { Employees, Messages } from "../../types.ts"

/**
 * The `EmployeeDetails` class manages the display and interaction with employee details in the UI.
 * It follows the singleton pattern to ensure that only one instance
 * of the class exists during the application runtime.
 * 
 * This class extends `DetailsBase` to provide specialized functionality for viewing and interacting
 * with employee records. It handles:
 * - Displaying detailed employee information (profile, contact details, status)
 * - Managing employee favorites
 * - Initiating message conversations
 * - Downloading and displaying profile images
 * - Providing edit capabilities for admins or self
 * @extends DetailsBase<Employees>
 */
export class EmployeeDetails extends DetailsBase<Employees> {

	/** A private static property to hold the singleton instance of `EmployeeDetails`
	 * @static 
	 * @private
	 */
	static #instance: EmployeeDetails

	/**
	 * Constructs an instance of `EmployeeDetails` and initializing the view and data.
	 * If an instance already exists, it returns the existing instance, ensuring only
	 * one instance of the class is active at a time, follows the singleton pattern.
	 * @constructor
	 */
	constructor() {
		super(".employees-view")
		this.initialize()
		if (!!EmployeeDetails.#instance) {
			return EmployeeDetails.#instance
		}
		EmployeeDetails.#instance = this
	}

	/**
	 * Retrieves the singleton instance of the `EmployeeDetails` class.
	 * If the instance does not exist, it creates a new one.
	 * This method ensures that only one instance of `EmployeeDetails` is used 
	 * throughout the application, maintaining a consistent state and preventing 
	 * multiple instances from interfering with each other.
	 * @static
	 */
	static getInstance() {
		if (!EmployeeDetails.#instance) {
			new EmployeeDetails()
		}
		return EmployeeDetails.#instance
	}

	/**
	 * Initializes the employee details by waiting for the employee grid to be 
	 * ready, fetching employee data and rendering.
	 * @protected
	 */
	protected async initialize() {
		await EmployeesGrid.getInstance().waitForInitialization()
		this.data = this.getDataByReference()
		this.render()
	}

	protected getRecordsStore() {
		return employeesStore 
	}
	
	public updateDetails(employeeDetails: Employees) {
		this.data = employeeDetails
		this.render()
	}

	protected closeDetails() {
		EmployeesGrid.getInstance().setGridActiveItem(null)
		router.navigate(EmployeesGrid.getInstance().getGridUrlRoute())
	}

	/**
	 * Opens the edit employee dialog to allow editing the selected employee's details.
	 * @protected
	 */
	protected async openEditEmployeeDialog() {
		const { EditEmployeeDialog } = await import("@components/dialogs/EditEmployeeDialog.ts")
		const editEmployeeDialog = new EditEmployeeDialog()
		editEmployeeDialog.open()
	}

	/**
	 * Checks if a message thread already exists between the current employee and the logged-in user.
	 * If a thread exists, navigates to the corresponding message page. If the messages store is empty,
	 * it fetches and renders the grid data before navigation.
	 *
	 * @protected
	 * @param currentEmployeeReference - The reference of the current employee.
	 * @param loggedInUserReference - The reference of the logged-in user.
	 * @returns A promise that resolves to `true` if a message thread exists and navigation occurs, otherwise undefined.
	 * @throws Displays a toast notification if an error occurs during the process.
	 * @note The query uses the `or` method to check for an existing message thread in either direction:
	 * - Messages where the current employee is the receiver and logged-in user is the sender.
	 * - Messages where the logged-in user is the receiver and current employee is the sender.
	 * - This ensures we find any existing conversation between the two parties regardless of who initiated it.
	 */
	protected existingMessage = async (currentEmployeeReference: number, loggedInUserReference: number) => {
		try {
			const { data, error } = await this.supabase
				.from("messages")
				.select("reference")
				.or(
					`and(receiver_reference.eq.${currentEmployeeReference},sender_reference.eq.${loggedInUserReference}),` +
					`and(receiver_reference.eq.${loggedInUserReference},sender_reference.eq.${currentEmployeeReference})`
				)
				.limit(1)
				.returns<Messages[]>()
				.maybeSingle()
			if (error) throw error
			if (data) {
				if (messagesStore.get()?.length === 0) {
					await MessagesGrid.getInstance().getGridDataAndRender()
				}
				router.navigate(`/support/my-messages/${data.reference.toString()}`)
				return true
			}
		} catch (error: any) {
			console.error(error)
			Toast({ message: error.message || "Failed to start conversation" })
		}
	}

	/**
	 * Initiates a new message conversation between the logged-in user and the specified employee.
	 * 
	 * Attempts to insert a new message record into the `messages` table. If the conversation already exists 
	 * due a Race Condition(detected via PostgreSQL error code 23505 for unique constraint violation), it 
	 * falls back to handling the existing conversation via `existingMessage()`. On successful creation, refreshes 
	 * the messages grid and navigates to the new conversation.
	 * 
	 * @protected
	 * @param currentEmployeeReference - The reference of the current employee.
	 * @param loggedInUserReference - The reference of the logged-in user.
	 * @returns A promise that resolves when the operation is complete, or undefined if falling back to existing message.
	 * @throws Displays a toast notification if an error occurs during the process (except for unique constraint violations).
	 */
	protected newMessage = async (currentEmployeeReference: number, loggedInUserReference: number) => {
		try {
			const { data, error } = await this.supabase
				.from("messages")
				.insert({ 
					receiver_reference: currentEmployeeReference, 
					sender_reference: loggedInUserReference,
					conversations: null,
					receiver_unread: null,
					sender_unread: null
				})
				.select("reference")
				.limit(1)
				.returns<Messages[]>()
				.maybeSingle()
			if (error) throw error
			if (data) {
				await MessagesGrid.getInstance().getGridDataAndRender()
				await router.navigate(`/support/my-messages/${data.reference.toString()}`)
				return
			}
		} catch (error: any) {
			if (error.code === "23505") {
				await this.existingMessage(currentEmployeeReference, loggedInUserReference)
			} else {
				console.error(error)
				Toast({ message: error.message || "Failed to start conversation" })
			}
		}
	}

	/**
	 * Sends a message to the current employee if a conversation does not already exist.
	 * 
	 * - Retrieves the current employee's reference and the logged-in user's reference.
	 * - Displays a toast notification if either reference is missing.
	 * - Does nothing if the logged-in user is the same as the current employee.
	 * - Checks for an existing message thread between the two users.
	 * - If no existing message is found, creates a new message thread.
	 * 
	 * @protected
	 */
	protected sendMessage = async () => {
		const currentEmployeeReference = this.data?.reference
		const loggedInUserReference = this.loggedInUserData?.reference
		if (!loggedInUserReference || !currentEmployeeReference) {
			Toast({ message: "Missing user references" })
			return
		}
		if (loggedInUserReference === currentEmployeeReference) return
		const existingMessage = await this.existingMessage(currentEmployeeReference, loggedInUserReference)
		if (!existingMessage) {
			await this.newMessage(currentEmployeeReference, loggedInUserReference)
		}
	}

	/**
	 * Downloads the profile avatar image for a given employee and updates the 
	 * profile avatar store.
	 *
	 * @protected
	 * @param employeeId - The id of the employee whose avatar is to be downloaded.
	 * @param path - The file path where the avatar image should be saved.
	 */
	protected async downloadProfileAvatar(employeeId: string, path: string) {
		await downloadFile({
			bucket: "avatars",
			id: employeeId,
			filePath: path,
			downloadingSet: this.downloadingAvatarImages,
			onSuccess: (id, fileUrl) => {
				profileAvatarStore.set({ ...profileAvatarStore.get(), [id]: fileUrl })
				this.render()
			}
		})
	}

	/**
	 * Downloads the profile hero image for a given employee and updates the profile 
	 * hero store with the image URL.
	 *
	 * @protected
	 * @param employeeId - The id of the employee whose profile hero image is to be downloaded.
	 * @param path - The file path where the image should be saved.
	 */
	protected async downloadProfileHero(employeeId: string, path: string) {
		await downloadFile({
			bucket: "avatars",
			id: employeeId,
			filePath: path,
			downloadingSet: this.downloadingHeroImages,
			onSuccess: (id, fileUrl) => {
				profileHeroStore.set({ ...profileHeroStore.get(), [id]: fileUrl })
				this.render()
			}
		})
	}

	/**
	 * Toggles the favorite status of the current employee.
	 * 
	 * This method updates the favorite employees list by calling 
	 * `toggleFavorites` with the "favEmployee" key, then reinitializes 
	 * and re-renders the `SettingsSideNav` to reflect the changes in the UI.
	 * @protected
	 */
	protected toggleFavoriteEmployee = () => {
		this.toggleFavorites("favEmployee")
		SettingsSideNav.getInstance().initializeFavorites()
		SettingsSideNav.getInstance().render()
	}

	/**
	 * Determines whether the current employee is marked as a favorite.
	 *
	 * @protected
	 * @returns True if the employee is a favorite; otherwise, false.
	 */
	protected isEmployeeFavorite = () => {
		return this.isFavorite("favEmployee")
	}

	headerTemplate() {
		const loggedInUserRole = this.loggedInUserData?.role
		const loggedInUserReference = this.loggedInUserData?.reference
		const currentEmployeeReference = this.data?.reference
		return html`
			${HeaderSection({
				templateContent: html`
					<vaadin-button 
						@click=${this.closeDetails} 
						class="back" 
						theme="icon tertiary contrast">
						<vaadin-icon src="/arrow-left.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text="Back">
						</vaadin-tooltip>
					</vaadin-button>
					<h2>Employee Details</h2>
					<vaadin-button
						@click=${this.toggleFavoriteEmployee}
						theme="icon tertiary contrast">
						<vaadin-icon 
						src=${this.isEmployeeFavorite() ? "/star-filled.svg" : "/star.svg"}>
						</vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text=${this.isEmployeeFavorite() ? "Remove from favorites" : "Add to favorites"}>
						</vaadin-tooltip>
					</vaadin-button>
					${
						loggedInUserReference === currentEmployeeReference ||
						loggedInUserRole === "admin"
						? html`
							<vaadin-button 
								@click=${this.openEditEmployeeDialog}
								id="editEmployeeButton" 
								theme="icon tertiary contrast">
								<vaadin-icon src="/edit.svg"></vaadin-icon>
								<vaadin-tooltip
									slot="tooltip" 
									text="Edit employee">
								</vaadin-tooltip>
							</vaadin-button>
						`
						: nothing
					}
					<vaadin-button 
						@click=${this.closeDetails} 
						class="close" 
						theme="icon tertiary contrast">
						<vaadin-icon src="/close.svg"></vaadin-icon>
						<vaadin-tooltip
							slot="tooltip" 
							text="Close">
						</vaadin-tooltip>
					</vaadin-button>
				`
			})}
		`
	}

	bodyTemplate() {
		const abbr = `${this.data?.first_name[0]}${this.data?.last_name[0]}`
		const { statusText, themeBadge } = processStatusBadge(this.data?.status)
		const createdAt = convertDateTime(this.data?.created_at)
		const heroPlaceholder = "/hero_placeholder.jpg"

		const currentProfileAvatarStore = profileAvatarStore.get()
		const profileAvatarUrl = currentProfileAvatarStore[this.data?.id!]
		if (this.data?.profile_avatar && (profileAvatarUrl === undefined)) {
			this.downloadProfileAvatar(this.data.id, this.data.profile_avatar)
		}

		const currentProfileHeroStore = profileHeroStore.get()
		const profileHeroUrl = currentProfileHeroStore[this.data?.id!]
		if (this.data?.profile_hero && (profileHeroUrl === undefined)) {
			this.downloadProfileHero(this.data.id, this.data.profile_hero)
		}

		return html`
			<vaadin-scroller theme="overflow-indicators" class="View-content">
				<div class="employee-profile-view flex flex-col" style="--hero-image: url(${profileHeroUrl || heroPlaceholder});">
					<div class="flex hero mb-xl pt-xl">
						<vaadin-avatar
							.img=${profileAvatarUrl || nothing}
							theme="xlarge" 
							name=${this.data?.first_name} ${this.data?.last_name}
							abbr=${abbr}>
						</vaadin-avatar>
					</div>
					<div class="flex flex-col p-l items-start gap-m">
						<div class="flex flex-col">
							<h3 class="text-2xl font-extrabold">${this.data?.first_name} ${this.data?.last_name}</h3>
						</div>
						${Badge({ 
							text: statusText, 
							theme: themeBadge
						})}
						<div class="text-secondary text-s">Joined ${createdAt}</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/role.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Role</h5>
								<div class="text-secondary">${this.data?.role}</div>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/briefcase.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Job title</h5>
								<div class="text-secondary">${this.data?.job_title}</div>
							</div>
						</div>
					</div>
					<hr>
					<div class="flex flex-col p-l gap-m">
						<h4>Contact Information</h4>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/email.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Email Address</h5>
								<a href="mailto:${this.data?.email}">
									${this.data?.email}
								</a>
							</div>
						</div>
						<div class="flex items-center gap-m leading-s">
							<vaadin-icon class="boxed-icon" src="/phone.svg"></vaadin-icon>
							<div>
								<h5 class="text-s m-0">Phone</h5>
								<a href="tel:${this.data?.phone}">
								${this.data?.phone}
								</a>
							</div>
						</div>
					</div>
				</div>
			</vaadin-scroller>
		`
	}

	protected footerTemplate = () => {
		const loggedInUserReference = this.loggedInUserData?.reference
		const currentEmployeeReference = this.data?.reference
		if (loggedInUserReference === currentEmployeeReference) {
			return nothing
		} else {
			return html`
				<footer class="View-footer">
					<div class="flex flex-col gap-s items-stretch p-m">
						<vaadin-button @click=${this.sendMessage} theme="contrast">
							<vaadin-icon slot="prefix" src="/support.svg"></vaadin-icon>
							Send Message
						</vaadin-button>
					</div>
				</footer>
			`
		}
	}

}
