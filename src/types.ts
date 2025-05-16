import type { APIContext } from "astro"
import type { Avatar } from "@vaadin/avatar"
import type { ActionAPIContext } from "astro:actions"
import type { FileOptions } from "@supabase/storage-js"
import type { MessageListItem } from "@vaadin/message-list"
import type { PreinitializedWritableAtom } from "nanostores"
import type { TemplateResult, RenderOptions } from "lit-html"

/**
 * Allow a list of options values or any string.
 */
type AnyStringWithAutocompleteOptions<
	TOptions extends string,
> = (string & {}) | TOptions

/**
 * Allow a strict list of options values.
 */
type StringWithAutocompleteOptions<TOptions extends string> = TOptions

/**
 * The type `ValidationErrorResponse` represents an error response for input validation errors with
 * specific error messages for each input field.
 * @property errorType - The `errorType` property in the `ValidationErrorResponse` type specifies the
 * type of error that occurred. In this case, it indicates that the error is related to input
 * validation.
 * @property errors - The `errors` property in the `ValidationErrorResponse` type is an object where
 * each key is a string representing the field that has validation errors, and the corresponding value
 * is an array of strings that represent the error messages associated with that field.
 */
export type ValidationErrorResponse = {
	errorType: "inputValidationError"
	errors: {
		[key: string]: string[]
	}
}

/**
 * Configuration object for initializing and updating counters.
 * 
 * The `CounterConfig` interface is used to configure a counter
 * associated with a specific store. It includes the store's name
 * and the store itself, which holds an array of items.
 * @template T - The type of the items within the store's array.
 */
export interface CounterConfig<T> {
	/** The string nano store name. */
	recordsStoreName: string
	/** The nano store itself. */
	recordsStore: PreinitializedWritableAtom<T[] | null>
}

/**
 * Represents the configuration for building favorite side navigation items.
 * 
 * This interface defines the necessary properties for generating a list of 
 * favorite navigation items based on stored user preferences and existing records.
 * @template T - The type of objects stored in the nano store.
 */
export interface FavoriteSideNavItem<T> {
	/**
	 * The base URL route for the navigation items.
	 */
	urlRoute: string
	/**
	 * The name of the icon to display next to each navigation item.
	 */
	iconName: string
	/**
	 * The name of the local storage item containing references to favorite items.
	 */
	storageItemName: string
	/**
	 * A writable nano store that contains an array of records.
	 */
	recordsStore: PreinitializedWritableAtom<T[] | null>
}

// ================================================
//    Supabase Fetch Data Interface
// ================================================
/**
 * Configuration options for fetching data from a specified table.
 */
export interface FetchDataOptions {
	/**
	 * The string name of the table to fetch data from.
	 */
	tableName: string
	/**
	 * The optional string selection query to specify which columns to fetch. 
	 * Defaults to `"*"` to fetch all columns.
	 */
	query?: string
	/**
	 * Match only rows where a specific column is equal to a given value.
	 */
	eq?: {
		/**
		 * The column name to apply the filter on.
		 */
		column: string
		/**
		 * The value to match in the specified column.
		 */
		value: any
	}
	/**
	 * Match only rows that satisfy at least one of the specified filters.
	 */
	or?: {
		/**
		 * The filters to use, following PostgREST syntax.
		 */
		filters: string
		/**
		 * Named parameters for advanced filtering.
		 */
		options?: {
			/**
			 * Set this to filter on referenced tables instead of the parent table.
			 */
			referencedTable?: string
			/**
			 * Deprecated, use `referencedTable` instead.
			 */
			foreignTable?: string
		}
	}
}

// ================================================
//    Supabase Delete File Interface
// ================================================
/**
 * Configuration options for deleting files from a specified storage bucket.
 */
export interface DeleteFileOptions {
	/**
	 * APIContext for server-side operations.
	 */
	context: APIContext | ActionAPIContext
	/** 
	 * The string name of the storage bucket.
	 */
	bucket: string
	/**
	 * The string name of the folder within the bucket 
	 * where files are stored.
	 */
	folderName: string
	/**
	 * The string base file name to search for. Files 
	 * starting with this name will be deleted.
	 */
	baseFileName: string
}

// ================================================
//    Supabase Upload File Interface
// ================================================
/**
 * Configuration options for uploading files to a specified storage bucket.
 */
export interface UploadFileOptions {
	/**
	 * APIContext for server-side operations.
	 */
	context: APIContext | ActionAPIContext
	/** 
	 * The string name of the storage bucket.
	 */
	bucket: string
	/** 
	 * The file path, including the file name. 
	 * Should be of the format `folder/subfolder/filename.png`. 
	 * The bucket must already exist before attempting to upload.
	 */
	filePath: string
	/** 
	 * The body of the file to be stored in the bucket.
	 */
	file: File
	/** 
	 * Optional file upload configurations, such as `content type`, 
	 * `header`, `cache control`, etc.
	 */
	fileOptions?: FileOptions
}

// ================================================
//    Supabase Download File Interface
// ================================================
/**
 * Configuration options for downloading files from a specified storage bucket.
 */
export interface DownloadFileOptions {
	/** 
	 * The string name of the storage bucket.
	 */
	bucket: string
	/** 
	 * The ID string associated with the downloaded file
	 */
	id: string
	/** 
	 * The string file path within the bucket to download.
	 */
	filePath: string
	/** 
	 * An optional `Set` to track and prevent duplicate 
	 * downloads for the same ID.
	 */
	downloadingSet?: Set<string>
	/** 
	 * Callback function executed after a successful download. 
	 * @param id - The ID associated with the downloaded file.
	 * @param fileUrl - The URL of the downloaded file.
	 */
	onSuccess: (id: string, fileUrl: string) => void
}

// ================================================
//    MenuBarItem Controller Interfaces
// ================================================
/**
 * Options for creating menu items with optional captions, icons, and styling.
 */
export interface CreateItemOptions {
	/** 
	 * The text caption displayed for the menu item.
	 */
	caption: string
	/** 
	 *  Optional URL or path to the icon image. If provided, an
	 * icon element is added with this path as the source. 
	 */
	iconPath?: string
	/** 
	 * Optional CSS class applied to the icon 
	 * element for additional styling.
	 */
	iconClass?: string
}
/**
 * Options for configuring avatar details for menu items, including user information and status.
 */
export interface CreateItemAvatarOptions{
	/** 
	 * The full name of the user, displayed in the item.
	 */
	name: string
	/** 
	 * The initials of the user, shown in the avatar
	 * when an image is not provided.
	 */
	initials: string
	/** 
	 * The current status of the user displayed as a badge.
	 */
	status: string
	/** 
	 * Optional URL for the user’s avatar image. 
	 * If not provided, initials will be shown.
	 */
	img?: string
}

// ================================================
//    ConfirmDialog Component Interface
// ================================================
/**
 * Configuration options for customizing the behavior and appearance of a confirmation dialog.
 */
export interface ConfirmDialogOptions {
	/** 
	 * The header text for the confirmation dialog. 
	 */
	header: string
	/** 
	 * The message content displayed in the dialog. 
	 */
	message: string
	/** 
	 * The text displayed on the confirm button. 
	 */
	confirmText: string
	/** 
	 * The theme for the confirm button, e.g., "primary" or "error". 
	 */
	confirmTheme: string
	/** 
	 * A space-delimited list of CSS class names to set on 
	 * the underlying overlay element.
	 */
	overlayClass?: string
	/** 
	 * Whether to show cancel button or not.
	 */
	cancelButton?: boolean
	/** 
	 * Set to true to disable closing dialog on Escape press.
	 */
	closeOnEsc?: boolean
}

// ================================================
//    Toast Component Interface
// ================================================
/**
 * Configuration options for displaying toast notifications, including message and appearance settings.
 */
export interface ToastOptions {
	/**
	 * The message to display in the toast.
	 */
	message: string
	/**
	 * The theme of the toast. Default is "contrast".
	 */
	theme?: string
	/**
	 * The duration in milliseconds to hide the toast. 
	 * Default is 5000
	 */
	duration?: number
}

// ================================================
//    Badge Component Interface
// ================================================
/**
 * Configuration options for setting badge properties, such as text, theme, and class attributes.
 */
export interface BadgeOptions {
	/**
	 * Set the inner text for the badge.
	 */
	text: string
	/**
	 * Set the theme attribute for the badge.
	 * Default value is "badge".
	 */
	theme: AnyStringWithAutocompleteOptions<
		"primary" | "success" | "error"
	>
	/**
	 * Set the class attribute for the badge.
	 */
	className: string
	/**
	 * Set the slot attribute for the badge.
	 */
	slot: string
	/**
	 * Allow additional attributes.
	 */
	[key: string]: any
}

// ================================================
//    SearchBar Component Interface
// ================================================
/**
 * Options for configuring the SearchBar component.
 */
export interface SearchBarOptions {
	/** 
	 * CSS selector for the element where the search bar will be rendered.
	 */
	selector: string
	/** 
	 * Placeholder text for the search input field (default: "Search").
	 */
	placeholder?: string
	/** 
	 * Whether to show a select-all checkbox (default: false).
	 */
	checkbox?: boolean
	/** 
	 * Whether to show a filter button (default: false).
	 */
	filterButton?: boolean
	/** 
	 * Number to display as a filter counter badge (default: undefined).
	 */
	filterCounter?: number
	/** 
	 * Callback function triggered when search term changes.
	 */
	onSearch?: (searchTerm: string) => void
	/** 
	 * Callback function triggered when select-all checkbox state changes.
	 */
	onSelectAll?: (checked: boolean) => void
	/** 
	 * Function that returns a template for the filter popover content.
	 */
	popoverTemplate?: () => TemplateResult
}

// ================================================
//    Observe and Render Utility Interfaces
// ================================================
/**
 * Options for rendering templates dynamically using `lit-html` with additional configuration.
 */
export interface ObserveAndRenderOptions {
	/**
	 * The `lit-html` template to render.
	 */
	template: TemplateResult | symbol
	/**
	 * The CSS selector for the target element where 
	 * the template will be rendered.
	 */
	targetSelector: string
	/**
	 * The extended render options for controlling 
	 * `lit-html` rendering.
	 */
	renderOptions?: ExtendedRenderOptions
}
/**
 * Extended the `lit-html` `RenderOptions` interface to include 
 * a selector for finding the `renderBefore` node.
 */
interface ExtendedRenderOptions extends RenderOptions {
	/**
	 * CSS selector to find the `renderBefore` node 
	 * if the direct reference is undefined.
	 */
	renderBeforeSelector?: string
}

// ================================================
//    Message Validation Utility Interface
// ================================================
/**
 * Configuration options for message validation.
 */
export interface MessageValidationConfig {
	/** Maximum allowed length of a message in characters */
	maxLength: number
	/** Minimum required length of a message in characters */
	minLength: number
	/** Rate limiting configuration */
	rateLimit: {
		/** Maximum number of messages allowed within the time window */
		maxMessages: number
		/** Time window for rate limiting in milliseconds */
		timeWindowMs: number
	}
}

// ================================================
//    Toggle Panels Controller Interface
// ================================================
/**
 * Options for managing the behavior of panel toggling and associated routing.
 */
export interface TogglePanelsOptions {
	/**
	 * A CSS selector to select the view element.
	 */
	viewSelector: string
	/**
	 * The route to navigate.
	 */
	routerNavigate: string
	/** 
	 * Single promise or array of promises that 
	 * must resolve before toggling panels.
	 */
	awaitFor?: Promise<any> | Promise<any>[]
}

// ===================================================
//    ActionDialogBase Class Interfaces
// ===================================================
/**
 * Base configuration interface for image handling operations.
 * Contains common properties used across different image operations.
 */
interface BaseImageConfig {
	/** Selector for the validation error element. */
	errorId: string
	/** Selector for the container element that holds the image. */
	imageContainer: string
}
/**
 * Configuration interface for image selection operations.
 * Extends BaseImageConfig with properties specific to selecting/uploading images.
 */
interface SelectImageConfig<T> extends BaseImageConfig {
	/** Selector for the remove button element. */
	removeId: string
	/** Function to set the image in the container element. */
	setImage: (element: T, url: string) => void
}
/**
 * Configuration interface for image removal operations.
 * Extends BaseImageConfig with properties specific to removing images.
 */
interface RemoveImageConfig<T> extends BaseImageConfig {
	/** Selector for the file input element. */
	inputId: string
	/** Function to clear the image from the container element. */
	clearImage: (element: T) => void
}
/**
 * Configuration object type for image selection operations.
 * Defines the configuration for each type of image that can be selected.
 */
export interface SelectConfig {
	/** Configuration for avatar image selection. */
	avatar: SelectImageConfig<Avatar>
	/** Configuration for hero image selection. */
	hero: SelectImageConfig<HTMLDivElement>
}
/**
 * Configuration object type for image removal operations.
 * Defines the configuration for each type of image that can be removed.
 */
export interface RemoveConfig {
	/** Configuration for avatar image removal. */
	avatar: RemoveImageConfig<Avatar>
	/** Configuration for hero image removal. */
	hero: RemoveImageConfig<HTMLDivElement>
}
/**
 * Configuration object for generating the template of the form 
 * action buttons based on the form type.
 */
export interface ActionButtonsTemplateConfig {
	/**
	 * The type of form being performed (either "add" or "edit").
	 */
	formType: StringWithAutocompleteOptions<"add" | "edit">
	/**
	 * The ID of the submit button.
	 */
	submitButtonId: string
}
/**
 * Configuration for rendering avatar image UI elements.
 */
export interface AvatarTemplateConfig<T> {
	/**
	 * The object data that contains the details of the item.
	 */
	recordDetails?: T
	/**
	 * The name of the avatar field in the form data.
	 */
	fieldName: string
	/**
	 * The URL of the avatar image to display, or undefined 
	 * if no avatar image is set.
	 */
	imageUrl?: string
}
/**
 * Configuration for rendering hero image UI elements.
 */
export interface HeroTemplateConfig<T> {
	/**
	 * The object data that contains the details of the item.
	 */
	recordDetails?: T
	/**
	 * The name of the hero field in the form data.
	 */
	fieldName: string
	/**
	 * The URL of the hero image to display, or undefined 
	 * if no hero image is set.
	 */
	imageUrl?: string
	/**
	 * Optional configuration to render an avatar inside 
	 * the hero template.
	 */
	includeAvatar?: {
		/**
		 * The name of the avatar field in the form data.
		 */
		fieldName: string
		/**
		 * The URL of the avatar image to display, or undefined 
		 * if no avatar image is set.
		 */
		imageUrl?: string
	}
}
/**
 * Configuration for rendering validation error messages.
 */
export interface ValidationErrorConfig {
	/**
	 * The name of the avatar field in the form data. If present,
	 * the validation error container will be rendered.
	 */
	avatarField?: string
	/**
	 * The name of the hero field in the form data. If present,
	 * the validation error container will be rendered.
	 */
	heroField?: string
}
/**
 * Configuration object for generating the template of form images.
 * @template T - Type of the record details data
 */
export interface FormImagesTemplateConfig<T> {
	/**
	 * The type of form being rendered.
	 */
	formType: StringWithAutocompleteOptions<"add" | "edit">
	/**
	 * The record data containing current field values.
	 */
	recordDetails?: T
	/**
	 * Configuration for the avatar image section.
	 */
	avatar?: {
		/**
		 * Field name for the avatar image in the form data.
		 */
		fieldName: string
		/**
		 * Current avatar image URL (if exists).
		 */
		imageUrl?: string
	}
	/**
	 * Configuration for the hero image section.
	 */
	hero?: {
		/**
		 * Field name for the hero image in the form data.
		 */
		fieldName: string
		/**
		 * Current hero image URL (if exists).
		 */
		imageUrl?: string
	}
}

// ===================================================
//    Form Controller Interfaces
// ===================================================
/**
 * Represents the configuration for constructing an API endpoint.
 */
export interface ApiEndpointConfig {
	/** 
	 * The type of action to be performed (e.g., "add", "edit", "delete").
	 */
	type: StringWithAutocompleteOptions<"add" | "edit" |"delete">
	/** 
	 * The name of the resource being modified (e.g., "location", "employee", "ticket").
	 */
	name: StringWithAutocompleteOptions<"location" | "employee" | "ticket" | "customer" | "starship">
}

// ================================================
//    Tickets Types
// ================================================
export type Tickets = {
	id: 							string
	created_at: 			string
	reference: 				number
	pickup_date: 			string
	return_date: 			string
	pickup_location:	Locations
	return_location:	Locations
	status: 					string
	total_cost: 			string
	rent_duration:		number
	customers:				Customers
	starships:				Starships
}

// ================================================
//    Customers Types
// ================================================
export type Customers = {
	id: 						string
	created_at: 		string
	reference: 			number
	first_name: 		string
	last_name: 			string
	nationality:		string
	language:				string
	email: 					string
	phone: 					string
	address: 				string
	driver_license: string
	date_of_birth: 	string
	age:						number
}

// ================================================
//    Location Types
// ================================================
export type Locations = {
	id: 								string
	created_at: 				string
	reference: 					number
	name: 							string
	description: 				string
	coordinates: 				string
	employees: 					number
	hours_of_operation: string
	gravity:						number
	planet_avatar:			string
	location_landscape:	string
}

// ================================================
//    Starships Types
// ================================================
export type Starships = {
	id: 						string
	created_at: 		string
	reference: 			number
	make: 					string
	model: 					string
	description:		string
	year: 					number
	fuel_type: 			string
	license_plate: 	string
	mileage: 				string
	status: 				string
	hero_image:			string
}

// ================================================
//    Messages Types
// ================================================
export type Messages = {
	id: 								string
	created_at: 				string
	reference:					number
	receiver_reference:	number
	sender_reference:		number
	receiver_unread:		boolean
	sender_unread:			boolean
	sender:							Employees
	receiver:						Employees
	conversations:			MessageListItem[]
}

// ================================================
//    Employees Types
// ================================================
export type Employees = {
	id:									string
	created_at:					string
	last_sign_in_at:		string
	reference:					number
	first_name:					string
	last_name:					string
	email:							string
	phone:							string
	job_title:					string
	role:								string
	status:							string
	profile_avatar:			string
	profile_hero:				string
	password:						string
	confirm_password:		string
}
