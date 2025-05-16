import { z } from "astro:schema"

const MSG_EMPTY_FIELD = "Field cannot be empty."

const MSG_MIN_MAKE = "Make must be longer than 2 characters."
const MSG_MAX_MAKE = "Make must be no more than 30 characters."
const MSG_INVALID_MAKE = "Make contains invalid characters."

const MSG_MIN_MODEL = "Model must be longer than 2 characters."
const MSG_MAX_MODEL = "Model must be no more than 30 characters."
const MSG_INVALID_MODEL = "Model contains invalid characters."

const MSG_MIN_DESCRIPTION = "Description must be longer than 20 characters."
const MSG_MAX_DESCRIPTION = "Description must be no more than 300 characters."
const MSG_INVALID_DESCRIPTION = "Description contains invalid characters."

const MSG_INVALID_YEAR = "Year must be a integer number."
const MSG_MIN_YEAR = "Year must be greater than 1999."
const MSG_MAX_YEAR = "Year must be less or equal than 3000."

const MSG_MIN_FUEL_TYPE = "Fuel type must be longer than 5 characters."
const MSG_MAX_FUEL_TYPE = "Fuel type must be no more than 30 characters."
const MSG_INVALID_FUEL_TYPE = "Fuel type contains invalid characters."

const MSG_INVALID_LICENSE_PLATE = "License plate invalid."

const MSG_INVALID_MILEAGE = "Mileage must be a integer number."
const MSG_MIN_MILEAGE = "Mileage must be longer than 99."
const MSG_MAX_MILEAGE = "Mileage must be less or equal than 9999."

const MSG_INVALID_STATUS = "Invalid status selected."
const STATUS = [
	"available",
	"maintenance",
	"rented"
] as const

const MSG_IMAGE_SIZE = "Max image size allowed is 1MB."
const MSG_IMAGE_FORMATS = "Only .jpg, .jpeg, .png and .webp formats are supported."
const MAX_FILE_SIZE = 1_048_576 // 1MB
const ACCEPTED_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
]

const GENERIC_REGEXP = /^(?!.*[ \t]{2})(?![ \t])(?:(?![ \t]$)[\p{L}\d\s,'\-.,:;]*|^)$/u
const LICENSE_PLATE_REGEX = /^[A-Za-z0-9]{3,10}(?:[- ]?[A-Za-z0-9]{2,5}){0,2}$/

export const starshipSchema = z.object({
	make: z
		.string()
		.min(3, { message: MSG_MIN_MAKE })
		.max(30, { message: MSG_MAX_MAKE })
		.regex(GENERIC_REGEXP, { message: MSG_INVALID_MAKE })
		.refine((val) => val !== "", { message: MSG_EMPTY_FIELD }),
	model: z
		.string()
		.min(3, { message: MSG_MIN_MODEL })
		.max(30, { message: MSG_MAX_MODEL })
		.regex(GENERIC_REGEXP, { message: MSG_INVALID_MODEL })
		.refine((val) => val !== "", { message: MSG_EMPTY_FIELD }),
	description: z
		.string()
		.min(21, { message: MSG_MIN_DESCRIPTION })
		.max(300, { message: MSG_MAX_DESCRIPTION })
		.regex(GENERIC_REGEXP, { message: MSG_INVALID_DESCRIPTION })
		.refine((val) => val !== "", { message: MSG_EMPTY_FIELD }),
	year: z
		.coerce.number({ message: MSG_INVALID_YEAR })
		.int({ message: MSG_INVALID_YEAR })
		.min(2000, { message: MSG_MIN_YEAR })
		.max(3000, { message: MSG_MAX_YEAR }),
	fuel_type: z
		.string()
		.min(6, { message: MSG_MIN_FUEL_TYPE })
		.max(30, { message: MSG_MAX_FUEL_TYPE })
		.regex(GENERIC_REGEXP, { message: MSG_INVALID_FUEL_TYPE })
		.refine((val) => val !== "", { message: MSG_EMPTY_FIELD }),
	license_plate: z
		.string()
		.regex(LICENSE_PLATE_REGEX, { message: MSG_INVALID_LICENSE_PLATE })
		.refine((val) => val !== "", { message: MSG_EMPTY_FIELD }),
	mileage: z
		.coerce.number({ message: MSG_INVALID_MILEAGE })
		.int({ message: MSG_INVALID_MILEAGE })
		.min(100, { message: MSG_MIN_MILEAGE })
		.max(9999, { message: MSG_MAX_MILEAGE }),
	status: z
		.enum(STATUS, { message: MSG_INVALID_STATUS }),
	hero_image: z
		.any()
		.optional()
		.refine((file) => !file || file.size <= MAX_FILE_SIZE, {
			message: MSG_IMAGE_SIZE,
		})
		.refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
			message: MSG_IMAGE_FORMATS,
		}),
})
