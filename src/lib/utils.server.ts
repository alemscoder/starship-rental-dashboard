import { serverClient } from "@lib/server.ts"
import { StorageError } from "@supabase/storage-js"
import type { UploadFileOptions, DeleteFileOptions } from "../types.ts"

/**
 * Uploads a file to a specified Supabase storage bucket and 
 * allows additional upload options to be specified if required.

 * @param options An object containing the upload details.
 * @returns A Promise resolves with an object containing the
 * path of the uploaded file within the bucket.
 * @throws {StorageError} If there is an issue accessing the storage 
 * during the upload process, an error with details is thrown.
 * @example
 * // Upload a file to the "user-data" bucket under "documents/report.pdf"
 * const file = new File(["content"], "report.pdf", { type: "application/pdf" })
 * const result = await uploadFile({
 *    context: context,
 *    bucket: "user-data",
 *    filePath: "documents/report.pdf",
 *    file: file,
 *    fileOptions: { cacheControl: "3600" },
 * });
 * console.log(result.path); // Logs the path of the uploaded file
 */
export async function uploadFile(options: UploadFileOptions) {
	const { context, bucket, filePath, file, fileOptions } = options
	const supabase = serverClient(context)
	const { data: buckets, error: bucketsError } =
		await supabase.storage.listBuckets()
	if (bucketsError) {
		throw new StorageError(
			`Error accessing storage.\nCause: ${bucketsError.message}`
		)
	}
	if (!buckets.some((b) => b.name === bucket)) {
		throw new StorageError(
			`Error uploading file.\nCause: Bucket "${bucket}" does not exist.`
		)
	}
	const { data, error } = await supabase.storage
		.from(bucket)
		.upload(filePath, file, fileOptions)
	if (error) {
		throw new StorageError(`Error uploading file.\nCause: ${error.message}`)
	}
	return {
		path: data.path
	}
}

/**
 * Deletes files from a specified Supabase storage bucket based on a 
 * given base file name.
 *
 * @param options An object containing the delete details.
 * @returns A Promise resolves with an object containing:
 * - `filesDeleted`: The number of files successfully deleted.
 * - `warning`: A message if no matching files are found, otherwise `null`.
 * @throws {StorageError} If there is an issue accessing the storage, 
 * listing, or deleting files.
 * @example
 * // Deletes all files starting with "report_" in the "documents" folder 
 * // of the "user-data" bucket
 * const result = await deleteFiles({
 *    context: context,
 *    bucket: "user-data",
 *    folderName: "documents",
 *    baseFileName: "report_"
 * });
 * console.log(result.filesDeleted); // Logs the number of files deleted
 * console.log(result.warning); // Logs a warning if no files were found
 */
export async function deleteFiles(options: DeleteFileOptions) {
	const { context, bucket, folderName, baseFileName } = options
	const supabase = serverClient(context)
	const { data: buckets, error: bucketsError } =
		await supabase.storage.listBuckets()
	if (bucketsError) {
		throw new StorageError(
			`Error accessing storage.\nCause: ${bucketsError.message}`
		)
	}
	if (!buckets.some((b) => b.name === bucket)) {
		throw new StorageError(
			`Error deleting file(s).\nCause: Bucket "${bucket}" does not exist.`
		)
	}
	const { data: existingFiles, error: listError } = await supabase.storage
		.from(bucket)
		.list(folderName, {
			search: baseFileName,
		})
	if (listError) {
		throw new StorageError(
			`Error listing file(s) for delete.\nCause: ${listError.message}`
		)
	}
	if (!existingFiles || existingFiles.length === 0) {
		return {
			filesDeleted: 0,
			warning: `No file(s) found for "${baseFileName}"`
		}
	}
	const filesToDelete = existingFiles
		.filter((file) => file.name.startsWith(baseFileName))
		.map((file) => `${folderName}/${file.name}`)
	if (filesToDelete.length === 0) {
		return {
			filesDeleted: 0,
			warning: `No file(s) found starting with "${baseFileName}"`
		}
	}
	const { error: deleteError } = await supabase.storage
		.from(bucket)
		.remove(filesToDelete)
	if (deleteError) {
		throw new StorageError(
			`Error deleting file(s).\nCause: ${deleteError.message}`
		)
	}
	return {
		filesDeleted: filesToDelete.length,
		warning: null
	}
}
