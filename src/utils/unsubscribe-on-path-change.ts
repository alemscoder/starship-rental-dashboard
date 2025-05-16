import { unsubscribeFrom } from "@store/unsubscribe.store.ts"
import type { Context } from "@thepassle/app-tools/router.js"

/**
 * Unsubscribes from specific stores or methods based on the current path
 * in the provided route context. This function is intended to clean up
 * unnecessary store subscriptions when the user navigates away from 
 * certain routes, optimizing performance and preventing memory leaks.
 * 
 * @param routeContext - The context object containing the URL 
 * path, used to determine which stores or methods to unsubscribe 
 * from based on the current route.
 */
export function unsubscribeOnPathChange(routeContext: Context) {

	if (!routeContext.url.pathname.includes("rentals")) {
		unsubscribeFrom("ticketsStore")
		unsubscribeFrom("customersStore")
		unsubscribeFrom("locationsStore")
		//unsubscribeFrom("RealtimeChannelTickets")
		//unsubscribeFrom("RealtimeChannelCustomers")
	}
	if (!routeContext.url.pathname.includes("ships")) {
		unsubscribeFrom("starshipsStore")
		//unsubscribeFrom("RealtimeChannelStarships")
	}
	if (!routeContext.url.pathname.includes("support")) {
		unsubscribeFrom("messagesStore")
		//unsubscribeFrom("RealtimeChannelMessages")
	}
	if (!routeContext.url.pathname.includes("settings")) {
		unsubscribeFrom("employeesStore")
		unsubscribeFrom("profileAvatarStore")
		unsubscribeFrom("userDataStore")
		unsubscribeFrom("reRenderUserAvatar")
		//unsubscribeFrom("RealtimeChannelEmployees")
	}
	unsubscribeFrom("updateIndeterminateCheckbox")
	
}
