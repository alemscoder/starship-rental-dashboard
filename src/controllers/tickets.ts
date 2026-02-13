import type { TextField } from "@vaadin/text-field"

/**
 * Calculates the duration between two rent date-times and returns the result in days and hours.
 *
 * @param startRentDateTime - The ISO string representing the start date and time of the rent.
 * @param endRentDateTime - The ISO string representing the end date and time of the rent.
 * @returns An object containing:
 *   - `success`: Indicates whether the calculation was successful.
 *   - `message`: A string describing the duration in days and hours, or an error message if the end date is not after the start date.
 */
export function calculeRentDuration(
	startRentDateTime: string | undefined, 
	endRentDateTime: string | undefined
) {
	if (startRentDateTime && endRentDateTime) {
		const startDate = new Date(startRentDateTime)
		const endDate = new Date(endRentDateTime)
		const differenceMs = Number(endDate) - Number(startDate)
		if (differenceMs <= 0) {
			return { 
				success: false, 
				message: "Invalid rent duration, end date cannot be earlier or equal than the start date."
			}
		}
		const days = Math.floor(differenceMs / (1000 * 60 * 60 * 24))
		const hours = Math.floor((differenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
		return { 
			success: true, 
			message: `${days} day(s) and ${hours} hour(s)` 
		}
	}
}

/**
 * Updates the rent duration field in the UI based on the provided start and end rent date-times.
 *
 * This function calculates the rent duration using `calculeRentDuration` and updates the
 * corresponding Vaadin text field (`vaadin-text-field[name='rent_duration']`) with the result.
 * If the calculation is unsuccessful, it clears the field, marks it as invalid, and displays an error message.
 * If successful, it sets the field value to the duration message and clears any error state.
 *
 * @param startRentDateTime - The start date-time of the rent period as an ISO string or `undefined`.
 * @param endRentDateTime - The end date-time of the rent period as an ISO string or `undefined`.
 * @returns The result of the rent duration calculation, including success status and message.
 */
export function updateRentDurationField(
	startRentDateTime: string | undefined, 
	endRentDateTime: string | undefined
) {
	const rentDuration = calculeRentDuration(startRentDateTime, endRentDateTime)
	const rentDurationField = document.querySelector(
		"vaadin-text-field[name='rent_duration']"
	) as TextField | null
	if (rentDuration && rentDurationField) {
		if (!rentDuration.success) {
			rentDurationField.value = ""
			rentDurationField.invalid = true
			rentDurationField.errorMessage = rentDuration.message
		} else {
			rentDurationField.value = rentDuration.message
			rentDurationField.invalid = false
			rentDurationField.errorMessage = ""
		}
	}
	return rentDuration
}