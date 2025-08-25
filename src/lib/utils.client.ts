import { Toast } from "@components/Toast.ts"
import { browserClient } from "@lib/client.ts"
import { PostgrestError } from "@utils/errors.ts"
import { StorageError } from "@supabase/storage-js"
import type { FetchDataOptions, DownloadFileOptions } from "../types.ts"

/** Supabase browser client instance */
const supabase = browserClient()

/** Tracks the verification status of Supabase storage buckets. */
let isBucketVerified: { [bucketName: string]: boolean } = {}

/**
 * Fetches data from a specified table in the Supabase database.
 *
 * @template T The type of the data expected from the database.
 * @param options - An object containing the fetch details.
 * @returns A promise that resolves to an object containing the fetched data or an error message.
 * @example
 * // Fetch all data from the "tickets" table
 * const { tableData, errorMsg } = await fetchData<Tickets>({ 
 *  tableName: "tickets" 
 * })
 * @example
 * // Fetch only "name" and "age" columns from the "customers" table
 * const { tableData, errorMsg } = await fetchData<Customers>({
 *  tableName: "customers", query: "name, age"
 * })
 * @example
 * // Fetch data from the "orders" table where the "status" column is "completed"
 * const { tableData, errorMsg } = await fetchData<Orders>({
 *  tableName: "orders", eq: { column: "status", value: "completed" }
 * });
 * @example
 * // Fetch data from the "products" table where either "category" is "electronics" or "price" is less than 100.
 * const { tableData, errorMsg } = await fetchData<Products>({
 *   tableName: "products",
 *   query: "*",
 *   eq: undefined, // No "eq" filter
 *   or: { filters: "category.eq.electronics,price.lt.100" }
 * });
 */
export async function fetchData<T>(options: FetchDataOptions) {
	const { tableName, query = "*", eq, or } = options
	/** The returned error message */
	let errorMsg: string | null = null
	/** The returned table data */
	let tableData: T[] | null = null
	try {
		// Initial build of the query
		let queryBuilder = supabase.from(tableName).select(query)
		// Add conditional filter if defined
		if (eq) {
			queryBuilder = queryBuilder.eq(eq.column, eq.value)
		}
		if (or) {
			const { filters, options } = or
			queryBuilder = queryBuilder.or(filters, options)
		}
		// Execute the query with the returned data type
		const { data, error } = await queryBuilder.returns<T[]>()
		if (error) {
			throw new PostgrestError({message: error.message})
		} else {
			tableData = data
		}
	} catch (error: any) {
		console.error(`Error fetching ${tableName}:`, error)
		if (error instanceof PostgrestError) {
			errorMsg = `There was an error fetching the ${tableName} data.\n${error.message}`
		} else {
			errorMsg = `An unexpected error occurred.\n${error.message}`
		}
	}
	return { tableData, errorMsg }
}

/**
 * Downloads a file from a specified Supabase storage bucket.
 * - The `downloadingSet` is an optional Set that tracks concurrent downloads by ID:
 *   - Before starting a download, checks if the ID exists in the set.
 *   - If present, the download is skipped to prevent duplicate requests.
 *   - If not present, adds the ID to the set before starting.
 *   - Removes the ID upon successful download completion.
 * - Verifies the existence of the specified bucket if it hasn’t 
 * 	 been verified before.
 * - The `onSuccess` callback is invoked upon successful download, with the ID
 * 	 and the file’s blob URL.
 * - In case of download failure, an error message is shown in a Toast Notification.
 * 
 * @param options - An object containing the download details.
 * @returns Resolves when the download process is complete.
 * @throws {StorageError} If there is an issue accessing the storage during the
 * download process, an error with details is thrown.
 * @example
 * // Download file with a success callback
 * downloadFile({
 *   bucket: "avatars",
 *   id: "9d962809-d1ae-4835-9e6a-a33c8d2e0b96",
 *   filePath: "employees/sophia.lee.jpg",
 *   onSuccess: (id, fileUrl) => console.log(`Downloaded file for ${id}: ${fileUrl}`)
 * });
 */
export async function downloadFile(options: DownloadFileOptions) {
	const { bucket, id, filePath, downloadingSet, onSuccess } = options
	// Duplicate control outside the try block
	if (downloadingSet?.has(id)) return
	downloadingSet?.add(id)
	try {
		if (!isBucketVerified[bucket]) {
			const { data: buckets, error: bucketsError } =
				await supabase.storage.listBuckets()
			if (bucketsError) {
				throw new StorageError(
					`Error accessing storage.\nCause: ${bucketsError.message}`
				)
			}
			if (buckets.some((b) => b.name === bucket)) {
				isBucketVerified[bucket] = true
			} else {
				throw new StorageError(
					`Error downloading file.\nCause: Bucket "${bucket}" does not exist.`
				)
			}
		}
		const { data, error } = await supabase.storage
			.from(bucket)
			.download(filePath)
		if (error) {
			throw new Error(
				`Error downloading the file "${filePath.split("/")[1]}".\nCause: File not found in the bucket "${bucket}".`,
			)
		}
		const fileUrl = URL.createObjectURL(data)
		onSuccess(id, fileUrl)
		downloadingSet?.delete(id)
	} catch (error: any) {
		console.error(error)
		if (error instanceof StorageError) {
			Toast({ message: error.message })
		} else {
			Toast({ message: error.message })
		}
	}
}
