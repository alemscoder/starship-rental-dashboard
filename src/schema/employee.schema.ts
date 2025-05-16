import { z } from "astro:schema"

// NOTE: To apply a union of different validators, use the z.discriminatedUnion() 
//	wrapper to narrow the type based on a specific form field.
//	see reference in: https://docs.astro.build/en/reference/api-reference/#input-validator

const MSG_INVALID_EMAIL = "Invalid email address."
const MSG_MIN_PASSWORD = "Password must be longer than 5 characters."
const MSG_PASSWORD_MATCH = "Passwords don't match, please verify."
const MSG_MIN_FIRST_NAME = "First name must be longer than 2 characters."
const MSG_MAX_FIRST_NAME = "First name must be no more than 20 characters."
const MSG_INVALID_FIRST_NAME = "First name contains invalid characters."
const MSG_MIN_LAST_NAME = "Last name must be longer than 2 characters."
const MSG_MAX_LAST_NAME = "Last name must be no more than 20 characters."
const MSG_INVALID_LAST_NAME = "Last name contains invalid characters."
const MSG_MIN_JOB_TITLE = "Job title must be longer than 2 characters."
const MSG_MAX_JOB_TITLE = "Job title must be no more than 30 characters."
const MSG_INVALID_JOB_TITLE = "Job title contains invalid characters."
const MSG_INVALID_ROLE = "Invalid role selected."
const MSG_INVALID_PHONE = "Please enter a valid phone number with country code (e.g., +521234567890)."
const MSG_IMAGE_SIZE = "Max image size allowed is 1MB."
const MSG_IMAGE_FORMATS = "Only .jpg, .jpeg, .png and .webp formats are supported."
const ROLES = [
	"admin",
	"manager",
	"staff"
] as const
const MAX_FILE_SIZE = 1_048_576 // 1MB
const ACCEPTED_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
]
const NAME_REGEXP = /^(?!.*[ \t]{2})(?![ \t])(?:(?![ \t]$)[\p{L}\s]*|^)$/u
const JOB_TITLE_REGEXP = /^(?!.*[ \t]{2})(?![ \t])(?:(?![ \t]$)[\p{L}\s.-]*|^)$/u
const PHONE_REGEXP = /^\+[1-9]\d{6,14}$/

export const newUser = z.object({
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
	password: z
		.string()
		.min(6, { message: MSG_MIN_PASSWORD }),
	confirm_password: z
		.string()
		.min(6, { message: MSG_MIN_PASSWORD }),
}).refine((data) => data.password === data.confirm_password, {
	message: MSG_PASSWORD_MATCH,
	path: ["confirm_password"]
})

export const newEmployeeSchema = z.object({
	email: z
		.string()
		.email({ message: MSG_INVALID_EMAIL }),
	password: z
		.string()
		.min(6, { message: MSG_MIN_PASSWORD }),
	confirm_password: z
		.string()
		.min(6, { message: MSG_MIN_PASSWORD }),
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
	job_title: z
		.string()
		.min(3, { message: MSG_MIN_JOB_TITLE })
		.max(30, { message: MSG_MAX_JOB_TITLE })
		.regex(JOB_TITLE_REGEXP, { message: MSG_INVALID_JOB_TITLE }),
	role: z
		.enum(ROLES, { message: MSG_INVALID_ROLE }),
	phone: z
		.string()
		.regex(PHONE_REGEXP, MSG_INVALID_PHONE),
	profile_avatar: z
		.any()
		.optional()
		.refine((file) => !file || file.size <= MAX_FILE_SIZE, {
			message: MSG_IMAGE_SIZE,
		})
		.refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
			message: MSG_IMAGE_FORMATS,
		}),
}).refine((data) => data.password === data.confirm_password, {
	message: MSG_PASSWORD_MATCH,
	path: ["confirm_password"]
})

export const editEmployeeSchema = z.object({
	email: z
		.string()
		.email({ message: MSG_INVALID_EMAIL })
		.optional(),
	first_name: z
		.string()
		.min(3, { message: MSG_MIN_FIRST_NAME })
		.max(20, { message: MSG_MAX_FIRST_NAME })
		.regex(NAME_REGEXP, { message: MSG_INVALID_FIRST_NAME })
		.optional(),
	last_name: z
		.string()
		.min(3, { message: MSG_MIN_LAST_NAME })
		.max(20, { message: MSG_MAX_LAST_NAME })
		.regex(NAME_REGEXP, { message: MSG_INVALID_LAST_NAME })
		.optional(),
	job_title: z
		.string()
		.min(3, { message: MSG_MIN_JOB_TITLE })
		.max(30, { message: MSG_MAX_JOB_TITLE })
		.regex(JOB_TITLE_REGEXP, { message: MSG_INVALID_JOB_TITLE })
		.optional(),
	role: z
		.enum(ROLES, { message: MSG_INVALID_ROLE })
		.optional(),
	phone: z
		.string()
		.regex(PHONE_REGEXP, MSG_INVALID_PHONE)
		.optional(),
	profile_avatar: z
		.any()
		.optional()
		.refine((file) => !file || file.size <= MAX_FILE_SIZE, {
			message: MSG_IMAGE_SIZE,
		})
		.refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
			message: MSG_IMAGE_FORMATS,
		}),
	profile_hero: z
		.any()
		.optional()
		.refine((file) => !file || file.size <= MAX_FILE_SIZE, {
			message: MSG_IMAGE_SIZE,
		})
		.refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
			message: MSG_IMAGE_FORMATS,
		}),
})
