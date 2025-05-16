import { createItem } from "@controllers/menu-bar.ts"
import type { MenuBar, SubMenuItem } from "@vaadin/menu-bar"

/**
 * Updates the user menu bar theme items to reflect the currently selected theme, 
 * ensuring that the relevant menu item is checked and the main theme icon is updated.
 *
 * This function first verifies that the `vaadin-menu-bar` element with the class `user-menu` is 
 * present in the DOM and that it contains a valid submenu. It then iterates through the 
 * submenu's children to set the `checked` property for the item that matches the selected theme. 
 * After updating the checked state, the main theme icon is updated based on the selected theme.
 * @param selectedTheme The string name of the selected theme (e.g., "light" or "dark").
 */
export function updateThemeMenuItems(selectedTheme: string) {
	const menuBar = document.querySelector("vaadin-menu-bar.user-menu") as MenuBar
	if (!menuBar || !menuBar.items || !menuBar.items[0]?.children) return
	const themeSubmenu = menuBar.items[0].children[4]
	if (!themeSubmenu?.children) return
	themeSubmenu.children.forEach((item: SubMenuItem) => {
		if (item.className) {
			item.checked = item.className === `theme-${selectedTheme}`
		}
	})
	themeSubmenu.component = createItem({
		caption: "Theme",
		iconPath: `/${selectedTheme}.svg`,
		iconClass: "small"
	})
	menuBar.items = [...menuBar.items]
}

/**
 * Retrieves the user's preferred theme stored in 
 * `localStorage`, if available.
 *
 * This function checks `localStorage` for a key named 
 * "theme" and returns its value if present.
 * It returns `undefined` if no theme is stored, which 
 * allows the application to fall back on a default.
 * @returns Returns the theme stored in `localStorage`, 
 * or `undefined` if no theme is found.
 */
export function getPreferredTheme() {
	const storedTheme = localStorage.getItem("theme")
	if (storedTheme) {
		return storedTheme
	}
}

/**
 * Loads and applies the system's preferred color scheme as the theme 
 * if no preferred theme is set by the user.
 *
 * If a theme preference is not stored in `localStorage`, this function will 
 * set the theme to the system's color scheme (either "dark" or "light").
 * It uses the `prefers-color-scheme` media query to detect the system theme, 
 * then updates the document's `theme` attribute accordingly and refreshes 
 * the theme menu items to reflect the system theme choice.
 */
export function loadSystemTheme() {
	const preferredTheme = getPreferredTheme()
	if (!preferredTheme) {
		const systemTheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
		document.documentElement.setAttribute("theme", systemTheme)
		updateThemeMenuItems("system")
	}
}

/**
 * Applies the specified theme by setting the document's theme attribute
 * and updating the user's theme preference in `localStorage`.
 *
 * If no `theme` is specified or `theme` is `"system"`, the 
 * system's preferred color scheme is applied.
 * 
 * @param theme The string theme to apply.
 */
export function applyTheme(theme: string | undefined) {
	switch (theme) {
		case "light":
			document.documentElement.setAttribute("theme", "light")
			localStorage.setItem("theme", "light")
			break
		case "dark":
			document.documentElement.setAttribute("theme", "dark")
			localStorage.setItem("theme", "dark")
			break
		case "system":
			document.documentElement.removeAttribute("theme")
			localStorage.removeItem("theme")
			loadSystemTheme()
			break
	}
}

/**
 * Loads and applies the user's preferred theme or defaults 
 * to the system theme if no preference is set.
 *
 * - Checks for a stored theme preference using `getPreferredTheme`.
 * - If a preferred theme is found, it applies this theme using `applyTheme`.
 * - If no preference is found, `loadSystemTheme` is called to apply the system's color scheme.
 */
export function loadPreferredTheme() {
	const preferredTheme = getPreferredTheme()
	if (preferredTheme) {
		applyTheme(preferredTheme)
	} else {
		loadSystemTheme()
	}
}
