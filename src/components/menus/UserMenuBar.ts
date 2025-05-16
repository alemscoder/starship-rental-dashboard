import { html } from "lit-html"
import router from "@router/router.ts"
import { listenKeys } from "nanostores"
import { downloadFile } from "@lib/utils.client.ts"
import { userDataStore } from "@store/userData.store.ts"
import { profileAvatarStore } from "@store/fileUrl.store.ts"
import { observeAndRender } from "@utils/observe-and-render.ts"
import { addUnsubscribe, unsubscribeStore } from "@store/unsubscribe.store.ts"
import { handleLogoutAndRedirect } from "@controllers/handle-logout-and-redirect.ts"
import { createItem, createItemAvatar, createItemAvatarBase } from "@controllers/menu-bar.ts"
import { getPreferredTheme, applyTheme, updateThemeMenuItems } from "@controllers/handle-theme.ts"
import type { MenuBarItem, MenuBarItemSelectedEvent } from "@vaadin/menu-bar"
import "@styles/menu-bar.css"

/**
 * Renders and manages the user menu bar component.
 *
 * The `UserMenuBar` function sets up a dynamic menu bar based on the 
 * logged-in user's data, allowing for real-time updates, theme adjustments, 
 * profile navigation, and logout functionality.
 * It integrates with various stores and handles user interactions.
 */
export async function UserMenuBar() {

	/** The color theme returned by `getPreferredTheme()` */
	const preferredTheme = getPreferredTheme()

	/**
	 * Retrieves the current user's data from the `userDataStore` 
	 * and enhances it with additional computed properties.
	 *
	 * @returns An object containing the user details.
	 */
	const getUserData = () => {
		const userData = userDataStore.get()
		return {
			id: userData?.id,
			fullName: `${userData?.first_name} ${userData?.last_name}`,
			initials: `${userData?.first_name[0]}${userData?.last_name[0]}`,
			status: userData?.status,
			reference: userData?.reference,
			avatarPath: userData?.profile_avatar,
			avatarUrl: profileAvatarStore.get()[userData?.id!]
		}
	}
	/** The object user data returned by `getUserData()` */
	let userData = getUserData()

	/**
	 * Downloads and updates the user's avatar if it's not already 
	 * available in the `profileAvatarStore`.
	 *
	 * This function ensures the user's avatar is fetched from 
	 * the remote storage and updates the local `profileAvatarStore` 
	 * for caching. If the avatar is successfully downloaded,
	 * it updates the `userData.avatarUrl` and triggers a re-render 
	 * of the user menu bar to reflect the change.
	 */
	const handleUserAvatarDownload = async () => {
		if (userData.id && userData.avatarPath && !profileAvatarStore.get()[userData.id]) {
			await downloadFile({
				bucket: "avatars",
				id: userData.id,
				filePath: userData.avatarPath,
				onSuccess: (id, fileUrl) => {
					profileAvatarStore.set({ ...profileAvatarStore.get(), [id]: fileUrl })
					userData.avatarUrl = profileAvatarStore.get()[userData?.id!]
					render()
				}
			})
		}
	}
	// Download avatar in background to allow immediate menu rendering
	handleUserAvatarDownload()

	/**
	 * Sets up a reactive listener to re-render the user avatar 
	 * when it updates in the `profileAvatarStore`.
	 *
	 * This function ensures that if the user's avatar URL is 
	 * updated in the `profileAvatarStore`, the user menu bar is 
	 * re-rendered to reflect the new avatar. The listener is 
	 * added only once per session for the current user, and 
	 * it unsubscribes when no longer needed.
	 */
	const reRenderUserAvatar = () => {
		const userId = userData?.id
		if (!unsubscribeStore.get()["reRenderUserAvatar"] && userId) {
			const unsubscribe = listenKeys(
				profileAvatarStore,
				[userId],
				(value, oldValue, changed) => {
					if (value[userId] && !oldValue[userId] && !changed) {
						const newAvatarUrl = value[userId]
						userData.avatarUrl = newAvatarUrl
						render()
					}
				}
			)
			addUnsubscribe("reRenderUserAvatar", unsubscribe)
		}
	}

	/**
	 * Sets up a reactive listener to re-render user data 
	 * when the `userDataStore` is updated.
	 *
	 * This function ensures that changes to the `userDataStore` 
	 * are reflected in the `userData` object and subsequently 
	 * re-renders the user menu. It also triggers the re-rendering 
	 * of the user's avatar by calling `reRenderUserAvatar()`. 
	 * The listener is only added if the current URL matches
	 * a specific condition.
	 */
	const reRenderUserData = () => {
		const { pathname } = router.context.url
		if (!unsubscribeStore.get()["userDataStore"] && pathname.includes("settings")) {
			const unsubscribe = userDataStore.listen((value) => {
				userData = getUserData()
				reRenderUserAvatar()
				render()
			})
			addUnsubscribe("userDataStore", unsubscribe)
		}
	}
	reRenderUserData()

	/**
	 * Creates the menu items for the user menu bar.
	 *
	 * @returns An array of menu bar items, each representing an action or submenu.
	 */
	const createMenuItems = (): MenuBarItem[] => {
		return [
			{
				component: createItemAvatarBase({
					name: userData.fullName,
					initials: userData.initials,
					status: userData.status!,
					img: userData.avatarUrl,
				}),
				theme: "tertiary-inline",
				children: [
					{
						component: createItemAvatar({
							name: userData.fullName,
							initials: userData.initials,
							status: userData.status!,
							img: userData.avatarUrl,
						}),
						className: "uncheckable",
						disabled: true,
					},
					{ component: "hr" },
					{
						component: createItem({
							caption: "Profile",
							iconPath: "/user.svg",
							iconClass: "small",
						}),
						className: "uncheckable menu-item-profile",
					},
					{
						component: createItem({
							caption: "Preferences",
							iconPath: "/adjustments.svg",
							iconClass: "small",
						}),
						className: "uncheckable menu-item-preferences",
					},
					{
						component: createItem({
							caption: "Theme",
							iconPath: `/${preferredTheme ?? "system"}.svg`,
							iconClass: "small",
						}),
						className: "uncheckable",
						children: [
							{
								component: createItem({
									caption: "System",
									iconPath: "/system.svg",
									iconClass: "small",
								}),
								className: "theme-system",
								checked: preferredTheme === undefined,
							},
							{
								component: createItem({
									caption: "Light",
									iconPath: "/light.svg",
									iconClass: "small",
								}),
								className: "theme-light",
								checked: preferredTheme === "light",
							},
							{
								component: createItem({
									caption: "Dark",
									iconPath: "/dark.svg",
									iconClass: "small",
								}),
								className: "theme-dark",
								checked: preferredTheme === "dark",
							},
						],
					},
					{ component: "hr" },
					{
						component: createItem({
							caption: "Help",
							iconPath: "/help.svg",
							iconClass: "small",
						}),
						className: "uncheckable",
						children: [{ text: "Documentation" }, { text: "About" }],
					},
					{ component: "hr" },
					{
						component: createItem({
							caption: "Sign Out",
							iconPath: "/sign-out.svg",
							iconClass: "small",
						}),
						className: "uncheckable menu-item-sign-out",
					},
				],
			},
		]

	}

	/**
	 * Handles item selection in the user menu bar.
	 *
	 * @param event - The event triggered when an item is selected.
	 */
	const itemSelected = async (event: MenuBarItemSelectedEvent) => {
		const item = event.detail.value
		if (
			item.className === "theme-light" ||
			item.className === "theme-dark" ||
			item.className === "theme-system"
		) {
			const selectedTheme = item.className.split("-")[1]
			applyTheme(selectedTheme)
			updateThemeMenuItems(selectedTheme)
		}
		if (item.className?.includes("menu-item-profile")) {
			const { pathname } = router.context.url
			const employeesRoute = "/settings/employees/"
			if (pathname === `${employeesRoute}${userData.reference}`) {
				return
			} else {
				router.navigate(`${employeesRoute}${userData.reference}`)
			}
		}
		if (item.className?.includes("menu-item-sign-out")) {
			await handleLogoutAndRedirect()
		}
	}

	/**
	 * Defines the template for the user menu bar component.
	 *
	 * @returns The lit-html rendered template.
	 */
	const template = () => html`
		<vaadin-menu-bar
			@item-selected=${itemSelected}
			.items=${createMenuItems()}
			has-single-button
			class="user-menu">
		</vaadin-menu-bar>
	`

	/**
	 * Renders the `template` into the designated container.
	 */
	const render = () => {
		observeAndRender({
			template: template(),
			targetSelector: ".drawer-nav",
		})
	}
	render()
}
