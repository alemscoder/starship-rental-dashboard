import { z } from "astro:schema"

const MSG_MIN_FIRST_NAME = "First name must be longer than 2 characters."
const MSG_MAX_FIRST_NAME = "First name must be no more than 20 characters."
const MSG_INVALID_FIRST_NAME = "First name contains invalid characters."

const MSG_MIN_LAST_NAME = "Last name must be longer than 2 characters."
const MSG_MAX_LAST_NAME = "Last name must be no more than 20 characters."
const MSG_INVALID_LAST_NAME = "Last name contains invalid characters."

const MSG_INVALID_PHONE = "Invalid phone number."

const MSG_INVALID_EMAIL = "Invalid email address."

const MSG_MIN_NATIONALITY = "Nationality must be longer than 2 characters."
const MSG_MAX_NATIONALITY = "Nationality must be no more than 50 characters."
const MSG_INVALID_NATIONALITY = "Nationality contains invalid characters."

const MSG_MIN_LANGUAGE = "Language must be longer than 2 characters."
const MSG_MAX_LANGUAGE = "Language must be no more than 50 characters."
const MSG_INVALID_LANGUAGE = "Language contains invalid characters."

const MSG_INVALID_DATE_OF_BIRTH = "Invalid date of birth."

const MSG_INVALID_AGE = "Age must be a integer number."
const MSG_MIN_AGE = "Age must be greater than or equal to 18."

const MSG_INVALID_DRIVER_LICENSE = "Invalid driver license, must have between 1 and 4 capital letters followed by 6 numbers."

const MSG_MIN_ADDRESS = "Address must be longer than 20 characters."
const MSG_MAX_ADDRESS = "Address must be no more than 100 characters."
const MSG_INVALID_ADDRESS = "Address contains invalid characters."

const NAME_REGEXP = /^(?!.*[ \t]{2})(?![ \t])(?:(?![ \t]$)[\p{L}\s]*|^)$/u
const PHONE_REGEXP = /^[+]?[()0-9]{3}[-]?[0-9]{3}[-]?[0-9]{4,6}$/
const DATE_OF_BIRTH_REGEX = /^\d{4}-\d{2}-\d{2}$/
const DRIVER_LICENSE_REGEXP = /^[A-Z]{1,4}\d{6}$/
const ADDRESS_REGEXP = /^(?!.*[ \t]{2})(?![ \t])(?:(?![ \t]$)[\p{L}\d\s.,-]*|^)$/u

export const customerSchema = z.object({
	first_name: z
		.string()
		.min(3, { message: MSG_MIN_FIRST_NAME })
		.max(20, { message: MSG_MAX_FIRST_NAME })
		.regex(NAME_REGEXP, { message: MSG_INVALID_FIRST_NAME }),
	last_name: z
		.string()
		.min(3, { message: MSG_MIN_LAST_NAME })
		.max(20, { message: MSG_MAX_LAST_NAME })
		.regex(NAME_REGEXP, { message: MSG_INVALID_LAST_NAME }),
	email: z
		.string()
		.email({ message: MSG_INVALID_EMAIL }),
	phone: z
		.string()
		.regex(PHONE_REGEXP, MSG_INVALID_PHONE),
	nationality: z
		.string()
		.min(3, { message: MSG_MIN_NATIONALITY })
		.max(50, { message: MSG_MAX_NATIONALITY })
		.regex(NAME_REGEXP, { message: MSG_INVALID_NATIONALITY }),
	language: z
		.string()
		.min(3, { message: MSG_MIN_LANGUAGE })
		.max(20, { message: MSG_MAX_LANGUAGE })
		.regex(NAME_REGEXP, { message: MSG_INVALID_LANGUAGE }),
	date_of_birth: z
		.string()
		.regex(DATE_OF_BIRTH_REGEX, { message: MSG_INVALID_DATE_OF_BIRTH }),
	age: z
		.coerce.number({ message: MSG_MIN_AGE })
		.int({ message: MSG_INVALID_AGE })
		.min(18, { message: MSG_MIN_AGE }),
	driver_license: z
		.string()
		.regex(DRIVER_LICENSE_REGEXP, { message: MSG_INVALID_DRIVER_LICENSE }),
	address: z
		.string()
		.min(21, { message: MSG_MIN_ADDRESS })
		.max(100, { message: MSG_MAX_ADDRESS })
		.regex(ADDRESS_REGEXP, { message: MSG_INVALID_ADDRESS }),
})
