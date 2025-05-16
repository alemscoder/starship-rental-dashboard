/**
 * Creates a debounced function that delays invoking `func` until after `delay` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @template T - The type of the function to debounce
 * @param {T} func - The function to debounce
 * @param {number} delay - The number of milliseconds to delay
 * @returns {(...args: Parameters<T>) => void} - A new debounced function
 * @example
 * // Basic usage:
 * const debouncedFn = debounce((searchTerm: string) => {
 *   console.log(`Searching for: ${searchTerm}`);
 * }, 300);
 * 
 * // Type-safe usage with parameters:
 * const debouncedLog = debounce((message: string, count: number) => {
 *   console.log(message.repeat(count));
 * }, 200);
 * 
 * debouncedLog("Hello", 3); // Executes after 200ms of inactivity
 * 
 * @see {@link https://lodash.com/docs/4.17.15#debounce} Lodash implementation
 * @see {@link https://css-tricks.com/debouncing-throttling-explained-examples/} Debouncing vs Throttling
 */
export function debounce<T extends Function>(func: T, delay: number): (...args: any[]) => void {
	let timeoutId: ReturnType<typeof setTimeout>
	return function(this: any, ...args: any[]) {
		const context = this
		clearTimeout(timeoutId)
		timeoutId = setTimeout(() => {
			func.apply(context, args)
		}, delay)
	}
}