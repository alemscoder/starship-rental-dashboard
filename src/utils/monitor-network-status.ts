import { Toast } from "@components/Toast.ts"
import { Notification } from "@vaadin/notification"
import { unsubscribeFrom } from "@store/unsubscribe.store.ts"

/**
 * Monitors the network status of the application, handling both 
 * offline and online events. Displays notifications to inform the
 * user of connectivity changes and takes actions accordingly.
 */
export function monitorNetworkStatus() {
	
	const handleOfflineStatus = () => {
		const isOnline = navigator.onLine
		if (!isOnline && location.pathname !== "/login") {
			unsubscribeFrom("handleRefreshSession")
			Toast({ 
				message: `You're offline in this moment!\n` +
									`Changes made while disconnected won't be\n` +
									`saved and your session may end unexpectedly.`, 
				duration: -1
			})
		}
	}

	const handleOnlineStatus = () => {
		if (navigator.onLine && location.pathname !== "/login") {
			const toastNotification = document.querySelector("#toastNotification")
			if (toastNotification instanceof Notification) {
				toastNotification.close()
			}
			let secondsLeft = 5
			Toast({ 
				message: `You're back online! Reconnecting services...\n` +
									`Refreshing in ${secondsLeft} seconds`
			})
			const countdownInterval = setInterval(() => {
				secondsLeft--
				const toastMessage = document.querySelector<HTMLPreElement>("vaadin-notification-card pre")
				if (toastMessage) {
					toastMessage.textContent = `You're back online! Reconnecting services...\n` +
																			`Refreshing in ${secondsLeft} seconds`
				}
				if (secondsLeft <= 0) {
					clearInterval(countdownInterval)
					location.reload()
				}
			}, 1000)
		}
	}
	
	window.addEventListener("offline", handleOfflineStatus)
	window.addEventListener("online", handleOnlineStatus)

}
