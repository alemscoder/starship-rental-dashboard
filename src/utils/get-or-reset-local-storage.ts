/**
 * Retrieves and validates an array from localStorage, initializing it if invalid or missing.
 * 
 * The function will:
 * 1. Return the stored array if it exists and contains only elements of the specified type.
 * 2. Reset the storage to an empty array and return undefined if:
 *    - The stored value isn't a valid array.
 *    - The array contains invalid element types.
 *    - The item doesn't exist.
 *    - There's a parsing error.
 * Note: This function always initializes the storage with an empty array if invalid or missing.
 * @param storageItemName - The key of the item in localStorage.
 * @param elementType - The expected typeof for array elements ('number', 'string', etc.).
 * @returns The validated array or undefined if invalid/missing.
 * @throws {Error} If JSON parsing fails (though the error is caught and handled internally).
 * @example
 * // Get numbers array - returns either number[] or undefined
 * const numbers = getOrResetLocalStorage('user-scores', 'number');
 */
export function getOrResetLocalStorage(storageItemName: string, elementType: string) {
	const item = localStorage.getItem(storageItemName)
	if (item) {
		try {
			const parsedItem = JSON.parse(item)
			if (Array.isArray(parsedItem)) {
				if (parsedItem.every((element) => typeof element === elementType)) {
					return parsedItem
				} else {
					console.warn(`The array in localStorage contains non-${elementType} elements.`)
					localStorage.setItem(storageItemName, JSON.stringify([]))
				}
			} else {
				console.warn("The value in localStorage is not an array.")
				localStorage.setItem(storageItemName, JSON.stringify([]))
			}
		} catch (error) {
			console.error("Error parsing:", error)
			localStorage.setItem(storageItemName, JSON.stringify([]))
		}
	} else {
		localStorage.setItem(storageItemName, JSON.stringify([]))
	}
}