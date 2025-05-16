import { atom } from "nanostores"

/**
 * A Nano Store to manage unsubscribe functions for others nano stores or subscription methods.
 * 
 * This store holds an object where each key is the name of a store or method, and the 
 * value is a function that can be called to unsubscribe from that store or method. 
 * The value can also be `null` if there is no unsubscribe function available.
 */
export const unsubscribeStore = atom<{ [key: string]: (() => void) | null }>({})

/**
 * Adds an unsubscribe function for a specific nano store or subscription method to the `unsubscribeStore`.
 * 
 * @param name - The name of the store or method for which the unsubscribe function is added.
 * @param unsubscribe - The function to unsubscribe from the store or method.
 */
export const addUnsubscribe = (name: string, unsubscribe: () => void) => {
	const current = unsubscribeStore.get()
	unsubscribeStore.set({ ...current, [name]: unsubscribe })
}

/**
 * Unsubscribes from a specific nano store or subscription method and 
 * sets  its unsubscribe function to `null` to stop listening for 
 * changes to avoid unnecessary updates and memory leaks.
 * 
 * This function checks if there is an unsubscribe function 
 * for the given param `name`. If it exists, the function is 
 * called to unsubscribe and then removed from the `unsubscribeStore`.
 * 
 * @param name - The name of the store or method to unsubscribe from.
 */
export const unsubscribeFrom = (name: string) => {
	const current = unsubscribeStore.get()
	if (current[name]) {
		// call the unsubscribe function
		current[name]!()
		// clean the entry
		unsubscribeStore.set({ ...current, [name]: null })
		console.log(`Unsubscribe from: ${name}`)
	}
}

/**
 * Unsubscribes from all nano stores and subscription methods to stop 
 * listening for changes to avoid unnecessary updates and memory leaks.
 * 
 * This function iterates over all stores and methods name in the 
 * `unsubscribeStore`, calls their unsubscribe functions if they 
 * exist, and then sets the  unsubscribe functions to `null`.
 */
export const unsubscribeFromAll = () => {
	const current = unsubscribeStore.get()
	Object.keys(current).forEach(name => {
		if (current[name]) {
			// call every unsubscribe function
			current[name]!()
			// clean every entry
			current[name] = null
			console.log(`Unsubscribe from: ${name}`)
		}
	})
	unsubscribeStore.set(current)
}
