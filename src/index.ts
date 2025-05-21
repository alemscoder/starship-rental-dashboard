/** Local imports */
import "urlpattern-polyfill"
import "@router/router.ts"
import { monitorNetworkStatus } from "@utils/monitor-network-status.ts"
import { handleVisibilityChange } from "@controllers/handle-visibility-change.ts"
import { loadSystemTheme, loadPreferredTheme } from "@controllers/handle-theme.ts"

/** Vaadin imports */
import "@vaadin/vaadin-lumo-styles/color-global.js"
import "@vaadin/vaadin-lumo-styles/badge-global.js"
import "@vaadin/vaadin-lumo-styles/utility-global.js"
import "@vaadin/vaadin-lumo-styles/typography-global.js"
//import "@vaadin/accordion"
import "@vaadin/app-layout"
import "@vaadin/app-layout/vaadin-drawer-toggle"
import "@vaadin/avatar"
//import "@vaadin/avatar-group"
import "@vaadin/button"
//import "@vaadin/card"
import "@vaadin/checkbox"
import "@vaadin/checkbox-group"
//import "@vaadin/combo-box"
import "@vaadin/confirm-dialog"
//import "@vaadin/context-menu"
//import "@vaadin/custom-field"
import "@vaadin/date-picker"
//import "@vaadin/date-time-picker"
//import "@vaadin/details"
import "@vaadin/dialog"
import "@vaadin/email-field"
//import "@vaadin/form-layout"
import "@vaadin/grid"
import "@vaadin/grid/vaadin-grid-selection-column"
import "@vaadin/grid/vaadin-grid-sort-column"
import "@vaadin/horizontal-layout"
import "@vaadin/icon"
//import "@vaadin/icons"
//import "@vaadin/integer-field"
//import "@vaadin/item"
//import "@vaadin/list-box"
import "@vaadin/login"
//import "@vaadin/master-detail-layout"
import "@vaadin/menu-bar"
import "@vaadin/message-input"
import "@vaadin/message-list"
//import "@vaadin/multi-select-combo-box"
import "@vaadin/notification"
import "@vaadin/number-field"
import "@vaadin/password-field"
import "@vaadin/popover"
import "@vaadin/progress-bar"
//import "@vaadin/radio-group"
import "@vaadin/scroller"
import "@vaadin/select"
import "@vaadin/side-nav"
//import "@vaadin/split-layout"
import "@vaadin/tabs"
import "@vaadin/tabsheet"
//import "@vaadin/text-area"
import "@vaadin/text-field"
//import "@vaadin/time-picker"
import "@vaadin/tooltip"
//import "@vaadin/upload"
import "@vaadin/vertical-layout"
//import "@vaadin/virtual-list"

/** Wait for Vaadin web components to be defined before 
 * adding the "ready" class to the body element */
await Promise.allSettled([
	customElements.whenDefined("vaadin-app-layout")
])
document.body.classList.add("ready")

// Initialize startup functions
matchMedia(
	"(prefers-color-scheme: dark)"
).addEventListener("change", loadSystemTheme)
handleVisibilityChange()
loadPreferredTheme()
monitorNetworkStatus()
