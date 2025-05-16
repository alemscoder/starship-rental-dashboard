import { z } from "astro:schema"

const MSG_EMPTY_FIELD = "Field cannot be empty."

const MSG_MIN_NAME = "Name must be longer than 10 characters."
const MSG_MAX_NAME = "Name must be no more than 50 characters."
const MSG_INVALID_NAME = "Name contains invalid characters."

const MSG_MIN_DESCRIPTION = "Description must be longer than 20 characters."
const MSG_MAX_DESCRIPTION = "Description must be no more than 300 characters."
const MSG_INVALID_DESCRIPTION = "Description contains invalid characters."

const MSG_MIN_COORDINATES = "Coordinates must be longer than 5 characters."
const MSG_MAX_COORDINATES = "Coordinates must be no more than 30 characters."
const MSG_INVALID_COORDINATES = "Invalid coordinates format."

const MSG_MIN_HOURS_OF_OPERATION = "Hours of operation must be longer than 5 characters."
const MSG_MAX_HOURS_OF_OPERATION = "Hours of operation must be no more than 30 characters."
const MSG_INVALID_HOURS_OF_OPERATION = "Invalid hours of operation format."

const MSG_INVALID_EMPLOYEES = "Employees must be a integer number."
const MSG_MIN_EMPLOYEES = "Employees must be greater than or equal to 1."

const MSG_INVALID_GRAVITY = "Gravity must be a number."
const MSG_MIN_GRAVITY = "Gravity must be greater than or equal to 0.01."
const MSG_MAX_GRAVITY = "Gravity must be less than or equal to 2.50."
const MAX_GRAVITY_DECIMALS = "No more that two gravity decimals allowed."

const MSG_IMAGE_SIZE = "Max image size allowed is 1MB."
const MSG_IMAGE_FORMATS = "Only .jpg, .jpeg, .png and .webp formats are supported."
const MAX_FILE_SIZE = 1_048_576 // 1MB
const ACCEPTED_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
]

const NAME_REGEXP = /^(?!.*[ \t]{2})(?![ \t])(?:(?![ \t]$)[\p{L}\d\s,']*|^)$/u
const DESCRIPTION_REGEXP = /^(?!.*[ \t]{2})(?![ \t])(?:(?![ \t]$)[\p{L}\d\s,'’.]*|^)$/u
const COORDINATE_REGEXP = /^[+-]?\d+(\.\d+)?°?\s?(North|N|South|S|East|E|West|W)?,\s?[+-]?\d+(\.\d+)?°?\s?(North|N|South|S|East|E|West|W)?$/i
const HOURS_OF_OPERATION_REGEXP = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(\s*[–-]\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun))?,\s\d{2}:\d{2}\s(AM|PM)\s*[–-]\s*\d{2}:\d{2}\s(AM|PM)$/i
const GRAVITY_DECIMALS_REGEXP = /^\d+(\.\d{1,2})?$/

export const locationSchema = z.object({
	name: z
		.string()
		.min(11, { message: MSG_MIN_NAME })
		.max(50, { message: MSG_MAX_NAME })
		.regex(NAME_REGEXP, { message: MSG_INVALID_NAME })
		.refine((val) => val !== "", { message: MSG_EMPTY_FIELD }),
	description: z
		.string()
		.min(21, { message: MSG_MIN_DESCRIPTION })
		.max(300, { message: MSG_MAX_DESCRIPTION })
		.regex(DESCRIPTION_REGEXP, { message: MSG_INVALID_DESCRIPTION })
		.refine((val) => val !== "", { message: MSG_EMPTY_FIELD }),
	coordinates: z
		.string()
		.min(6, { message: MSG_MIN_COORDINATES })
		.max(30, { message: MSG_MAX_COORDINATES })
		.regex(COORDINATE_REGEXP, { message: MSG_INVALID_COORDINATES })
		.refine((val) => val !== "", { message: MSG_EMPTY_FIELD }),
	hours_of_operation: z
		.string()
		.min(6, { message: MSG_MIN_HOURS_OF_OPERATION })
		.max(30, { message: MSG_MAX_HOURS_OF_OPERATION })
		.regex(HOURS_OF_OPERATION_REGEXP, { message: MSG_INVALID_HOURS_OF_OPERATION })
		.refine((val) => val !== "", { message: MSG_EMPTY_FIELD }),
	employees: z
		.coerce.number({ message: MSG_INVALID_EMPLOYEES })
		.int({ message: MSG_INVALID_EMPLOYEES })
		.min(1, { message: MSG_MIN_EMPLOYEES }),
	gravity: z
		.coerce.number({ message: MSG_INVALID_GRAVITY })
		.min(0.01, { message: MSG_MIN_GRAVITY })
		.max(2.50, { message: MSG_MAX_GRAVITY })
		.refine((val) => GRAVITY_DECIMALS_REGEXP.test(val.toString()), { message: MAX_GRAVITY_DECIMALS }),
	planet_avatar: z
		.any()
		.optional()
		.refine((file) => !file || file.size <= MAX_FILE_SIZE, {
			message: MSG_IMAGE_SIZE,
		})
		.refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
			message: MSG_IMAGE_FORMATS,
		}),
	location_landscape: z
		.any()
		.optional()
		.refine((file) => !file || file.size <= MAX_FILE_SIZE, {
			message: MSG_IMAGE_SIZE,
		})
		.refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
			message: MSG_IMAGE_FORMATS,
		}),
})
