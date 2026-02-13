import { AppLayout } from "@vaadin/app-layout"
import { html, render, nothing } from "lit-html"
import { Router } from "@thepassle/app-tools/router.js"
import { litHtmlRender } from "@utils/lit-html-render.ts"
import { getUserData } from "@controllers/get-user-data.ts"
import { updatePathNavItem } from "@utils/update-path-nav-item.ts"
import { redirect } from "@thepassle/app-tools/router/plugins/redirect.js"
import { unsubscribeOnPathChange } from "@utils/unsubscribe-on-path-change.ts"
import { togglePanels, closeDetailsPanels } from "@controllers/handle-panels.ts"
import { handleSessionValidation } from "@controllers/handle-session-validation.ts"
//import { measurePerformance } from "@utils/dom-performance.ts"
import type { Config, Context } from "@thepassle/app-tools/router.js"
import { Dashboard } from "@components/Dashboard"

/** Stores the boolean result returned by the function `handleSessionValidation()` */
let sessionInvalid: boolean

/** Define the router configuration */
const routerConfig: Config = {
	/** Global plugins */
	plugins: [
		{
			name: "beforeNavigation",
			beforeNavigation: (context) => {
				// Append the application name to the current page title.
				context.title = `${context.title} - Starship Rental System`
			}
		},
		{
			name: "afterNavigation",
			afterNavigation: (context) => {
				if (context.url.pathname !== "/login") {
					// Updates the `path` property of specific navigation items.
					updatePathNavItem()
					// Unsubscribes from specific stores or methods based on the current.
					unsubscribeOnPathChange(context)
					// Close the drawer when navigation occurs on small screens.
					AppLayout.dispatchCloseOverlayDrawerEvent()
				}
			}
		},
	],
	fallback: "/404",
	routes: [
		{
			path: "/",
			title: "Dashboard",
			plugins: [
				//redirect("/rentals/tickets"),
				{
					name: "clearViews",
					afterNavigation: () => {
						Dashboard.getInstance().destroyChart()
						litHtmlRender({ template: nothing, targetSelector: ".View-container" })
						litHtmlRender({ template: nothing, targetSelector: "vaadin-scroller#sideNavScroller" })
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				new InitApp()
			}
		},
		{
			path: "/login",
			title: "Sign In",
			render: async () => {
				const { Login } = await import("@pages/login/login.ts")
				Login()
			}
		},
		{
			path: "/rentals",
			title: "Rentals",
			plugins: [
				{
					name: "clearViews",
					afterNavigation: () => {
						litHtmlRender({ template: nothing, targetSelector: ".View-container" })
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { RentalsSideNav } = await import("@pages/rentals/RentalsSideNav.ts")
				new InitApp()
				new RentalsSideNav()
			}
		},
		{
			path: "/rentals/tickets",
			title: "Tickets",
			plugins: [
				{
					name: "closePanel",
					afterNavigation: () => {
						closeDetailsPanels(".tickets-view")
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { RentalsSideNav } = await import("@pages/rentals/RentalsSideNav.ts")
				const { TicketsView } = await import("@views/TicketsView.ts")
				const { TicketsGrid } = await import("@components/grids/TicketsGrid.ts")
				new InitApp()
				new RentalsSideNav()
				new TicketsView()
				new TicketsGrid()
			}
		},
		{
			path: "/rentals/tickets/:reference",
			title: "Ticket Details",
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { RentalsSideNav } = await import("@pages/rentals/RentalsSideNav.ts")
				const { TicketsView } = await import("@views/TicketsView.ts")
				const { TicketsGrid } = await import("@components/grids/TicketsGrid.ts")
				const { TicketDetails } = await import("@components/panels/TicketDetails.ts")
				new InitApp()
				new RentalsSideNav()
				new TicketsView()
				new TicketsGrid()
				new TicketDetails()
				await togglePanels({ 
					viewSelector: ".tickets-view", 
					routerNavigate: "/rentals/tickets",
					awaitFor: [
						TicketsGrid.getInstance().waitForInitialization(), 
						TicketDetails.getInstance().waitForInitialization()
					] 
				})
			}
		},
		{
			path: "/rentals/customers",
			title: "Customers",
			plugins: [
				{
					name: "closePanel",
					afterNavigation: () => {
						closeDetailsPanels(".customers-view")
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { RentalsSideNav } = await import("@pages/rentals/RentalsSideNav.ts")
				const { CustomersView } = await import("@views/CustomersView.ts")
				const { CustomersGrid } = await import("@components/grids/CustomersGrid.ts")
				new InitApp()
				new RentalsSideNav()
				new CustomersView()
				new CustomersGrid()
			}
		},
		{
			path: "/rentals/customers/:reference",
			title: "Customer Details",
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { RentalsSideNav } = await import("@pages/rentals/RentalsSideNav.ts")
				const { CustomersView } = await import("@views/CustomersView.ts")
				const { CustomersGrid } = await import("@components/grids/CustomersGrid.ts")
				const { CustomerDetails } = await import("@components/panels/CustomerDetails.ts")
				new InitApp()
				new RentalsSideNav()
				new CustomersView()
				new CustomersGrid()
				new CustomerDetails()
				await togglePanels({ 
					viewSelector: ".customers-view", 
					routerNavigate: "/rentals/customers",
					awaitFor: [CustomersGrid.getInstance().waitForInitialization()] 
				})
			}
		},
		{
			path: "/rentals/invoices",
			title: "Invoices",
			plugins: [
				{
					name: "closePanel",
					afterNavigation: () => {
						closeDetailsPanels(".invoices-view")
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { RentalsSideNav } = await import("@pages/rentals/RentalsSideNav.ts")
				const { InvoicesView } = await import("@views/InvoicesView.ts")
				new InitApp()
				new RentalsSideNav()
				new InvoicesView()
			}
		},
		{
			path: "/rentals/locations",
			title: "Locations",
			plugins: [
				{
					name: "closePanel",
					afterNavigation: () => {
						closeDetailsPanels(".locations-view")
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { RentalsSideNav } = await import("@pages/rentals/RentalsSideNav.ts")
				const { LocationsView } = await import("@views/LocationsView.ts")
				const { LocationsGrid } = await import("@components/grids/LocationsGrid.ts")
				new InitApp()
				new RentalsSideNav()
				new LocationsView()
				new LocationsGrid()
			}
		},
		{
			path: "/rentals/locations/:reference",
			title: "Location Details",
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { RentalsSideNav } = await import("@pages/rentals/RentalsSideNav.ts")
				const { LocationsView } = await import("@views/LocationsView.ts")
				const { LocationsGrid } = await import("@components/grids/LocationsGrid.ts")
				const { LocationDetails } = await import("@components/panels/LocationDetails.ts")
				new InitApp()
				new RentalsSideNav()
				new LocationsView()
				new LocationsGrid()
				new LocationDetails()
				await togglePanels({ 
					viewSelector: ".locations-view", 
					routerNavigate: "/rentals/locations",
					awaitFor: [LocationsGrid.getInstance().waitForInitialization()] 
				})
			}
		},
		{
			path: "/ships",
			title: "Ships",
			plugins: [
				{
					name: "clearViews",
					afterNavigation: () => {
						litHtmlRender({ template: nothing, targetSelector: ".View-container" })
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { ShipsSideNav } = await import("@pages/ships/ShipsSideNav.ts")
				new InitApp()
				new ShipsSideNav()
			}
		},
		{
			path: "/ships/starships",
			title: "Starships",
			plugins: [
				{
					name: "closePanel",
					afterNavigation: () => {
						closeDetailsPanels(".starships-view")
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { ShipsSideNav } = await import("@pages/ships/ShipsSideNav.ts")
				const { StarshipsView } = await import("@views/StarshipsView.ts")
				const { StarshipsGrid } = await import("@components/grids/StarshipsGrid.ts")
				new InitApp()
				new ShipsSideNav()
				new StarshipsView()
				new StarshipsGrid()
			}
		},
		{
			path: "/ships/starships/:reference",
			title: "Starship Details",
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { ShipsSideNav } = await import("@pages/ships/ShipsSideNav.ts")
				const { StarshipsView } = await import("@views/StarshipsView.ts")
				const { StarshipsGrid } = await import("@components/grids/StarshipsGrid.ts")
				const { StarshipDetails } = await import("@components/panels/StarshipDetails.ts")
				new InitApp()
				new ShipsSideNav()
				new StarshipsView()
				new StarshipsGrid()
				new StarshipDetails()
				await togglePanels({ 
					viewSelector: ".starships-view", 
					routerNavigate: "/ships/starships",
					awaitFor: [StarshipsGrid.getInstance().waitForInitialization()] 
				})
			}
		},
		{
			path: "/support",
			title: "Support",
			plugins: [
				{
					name: "clearViews",
					afterNavigation: () => {
						litHtmlRender({ template: nothing, targetSelector: ".View-container" })
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { SupportSideNav } = await import("@pages/support/SupportSideNav.ts")
				new InitApp()
				new SupportSideNav()
			}
		},
		{
			path: "/support/my-messages",
			title: "My Messages",
			plugins: [
				{
					name: "closePanel",
					afterNavigation: () => {
						closeDetailsPanels(".messages-view")
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { SupportSideNav } = await import("@pages/support/SupportSideNav.ts")
				const { MessagesView } = await import("@views/MessagesView.ts")
				const { MessagesGrid } = await import("@components/grids/MessagesGrid.ts")
				new InitApp()
				new SupportSideNav()
				new MessagesView()
				new MessagesGrid()
			}
		},
		{
			path: "/support/my-messages/:reference",
			title: "Message Details",
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { SupportSideNav } = await import("@pages/support/SupportSideNav.ts")
				const { MessagesView } = await import("@views/MessagesView.ts")
				const { MessagesGrid } = await import("@components/grids/MessagesGrid.ts")
				const { MessageDetails } = await import("@components/panels/MessageDetails.ts")
				new InitApp()
				new SupportSideNav()
				new MessagesView()
				new MessagesGrid()
				new MessageDetails()
				await togglePanels({ 
					viewSelector: ".messages-view", 
					routerNavigate: "/support/my-messages",
					awaitFor: [MessagesGrid.getInstance().waitForInitialization()] 
				})
			}
		},
		{
			path: "/settings",
			title: "Settings",
			plugins: [
				{
					name: "clearViews",
					afterNavigation: () => {
						litHtmlRender({ template: nothing, targetSelector: ".View-container" })
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { SettingsSideNav } = await import("@pages/settings/SettingsSideNav.ts")
				new InitApp()
				new SettingsSideNav()
			}
		},
		{
			path: "/settings/employees",
			title: "Employees",
			plugins: [
				{
					name: "closePanel",
					afterNavigation: () => {
						closeDetailsPanels(".employees-view")
					}
				},
				{
					name: "updateIndeterminateCheckbox",
					afterNavigation: async () => {
						const { updateIndeterminateCheckbox } = await import("@utils/update-indeterminate-checkbox.ts")
						updateIndeterminateCheckbox()
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { SettingsSideNav } = await import("@pages/settings/SettingsSideNav.ts")
				const { EmployeesView } = await import("@views/EmployeesView.ts")
				const { EmployeesGrid } = await import("@components/grids/EmployeesGrid.ts")
				new InitApp()
				new SettingsSideNav()
				new EmployeesView()
				new EmployeesGrid()
			}
		},
		{
			path: "/settings/employees/:reference",
			title: "Employee Details",
			plugins: [
				{
					name: "updateIndeterminateCheckbox",
					afterNavigation: async () => {
						const { updateIndeterminateCheckbox } = await import("@utils/update-indeterminate-checkbox.ts")
						updateIndeterminateCheckbox()
					}
				}
			],
			render: async () => {
				const { InitApp } = await import("@pages/app.ts")
				const { SettingsSideNav } = await import("@pages/settings/SettingsSideNav.ts")
				const { EmployeesView } = await import("@views/EmployeesView.ts")
				const { EmployeesGrid } = await import("@components/grids/EmployeesGrid.ts")
				const { EmployeeDetails } = await import("@components/panels/EmployeeDetails.ts")
				new InitApp()
				new SettingsSideNav()
				new EmployeesView()
				new EmployeesGrid()
				new EmployeeDetails()
				await togglePanels({ 
					viewSelector: ".employees-view", 
					routerNavigate: "/settings/employees",
					awaitFor: [EmployeesGrid.getInstance().waitForInitialization()] 
				})
			}
		},
		{
			path: "/404",
			title: "Not found",
			render: () => html`
				<div class="h-full flex flex-col gap-y-m justify-center items-center">
					<h1>404 NOT FOUND</h1>
					<vaadin-button 
						@click=${() => history.back()} 
						theme="tertiary-inline"
						style="cursor:pointer;">
						Go back
					</vaadin-button>
				</div>
			`
		}
	]
}

// Initialize the router with the defined configuration
const router = new Router(routerConfig)

router.addEventListener("route-changed", async (event) => {
	const { context: routeContext } = event as unknown as { context: Context }
	//console.log(routeContext)

	// Validate the user's session and retrieve user data if necessary.
	sessionInvalid = await handleSessionValidation(routeContext)
	if (!routeContext.url.pathname.includes("login") && !sessionInvalid) {
		const success = await getUserData()
		if (!success) return
	}
	if (sessionInvalid) return
	
	/** Routes conditions */
	if (router.route.path === "/404") {
		render(router.render(), document.querySelector("#outlet") as HTMLDivElement)
	} else {
		router.render()
	}
})

/** Cleans up global event listeners 
 * (When active, I experiment render"s problem 
 * with navigation browser buttons) */
//router.uninstall()

export default router
