import { z } from "astro:schema"

const MSG_TICKET_UUID = "Ticket ID must be a valid UUID."
const MSG_CUSTOMER_UUID = "Customer ID must be a valid UUID."
const MSG_STARSHIP_UUID = "Starship ID must be a valid UUID."
const MSG_PICKUP_LOCATION_UUID = "Pickup location ID must be a valid UUID."
const MSG_RETURN_LOCATION_UUID = "Return location ID must be a valid UUID."
const MSG_INVALID_DATETIME = "Invalid datetime selected."
const MSG_RENT_DURATION = "Invalid rent duration, end date cannot be earlier or equal than the start date."
const MSG_TOTAL_COST = "Invalid cost entered."

const RENT_DURATION_REGEX = /^\d+ day\(s\) and \d+ hour\(s\)$/
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?$/
const TOTAL_COST_REGEX = /^(?!0+\.?0*$)(?!0\d)\d+(?:\.\d{1,2})?$/

export const newTicketSchema = z.object({
	customer: z
		.string()
		.uuid({ message: MSG_CUSTOMER_UUID }),
	starship: z
		.string()
		.uuid({ message: MSG_STARSHIP_UUID }),
	pickup_location: z
		.string()
		.uuid({ message: MSG_PICKUP_LOCATION_UUID }),
	return_location: z
		.string()
		.uuid({ message: MSG_RETURN_LOCATION_UUID }),
	pickup_date: z
		.string()
		.regex(DATETIME_REGEX, { message: MSG_INVALID_DATETIME })
		.refine((val) => {
			const selectedDate = new Date(val).getTime()
			const currentUTC = Date.now()
			return selectedDate >= currentUTC
		}, {
			message: "Start rent date cannot be earlier or equal than the actual date."
		}),
	return_date: z
		.string()
		.regex(DATETIME_REGEX, { message: MSG_INVALID_DATETIME }),
	// rent_duration: z
	// 	.string()
	// 	.regex(RENT_DURATION_REGEX, { message: MSG_RENT_DURATION }),
	total_cost: z
		.coerce.number()
		.refine((val) => TOTAL_COST_REGEX.test(val.toString()), { message: MSG_TOTAL_COST }),
})
.superRefine((data, ctx) => {
	if (data.pickup_location === data.return_location) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Pickup and return locations cannot be the same.",
			path: ["return_location"],
		})
	}
})

export const editTicketSchema = z.object({
	id: z
		.string()
		.uuid({ message: MSG_TICKET_UUID }),
	starship: z
		.string()
		.uuid({ message: MSG_STARSHIP_UUID })
		.optional(),
	return_location: z
		.string()
		.uuid({ message: MSG_RETURN_LOCATION_UUID })
		.optional(),
	pickup_date: z
		.string()
		.regex(DATETIME_REGEX, { message: MSG_INVALID_DATETIME })
		.optional(),
	return_date: z
		.string()
		.regex(DATETIME_REGEX, { message: MSG_INVALID_DATETIME })
		.optional(),
	total_cost: z
		.coerce.number()
		.refine((val) => TOTAL_COST_REGEX.test(val.toString()), { message: MSG_TOTAL_COST })
		.optional(),
})
