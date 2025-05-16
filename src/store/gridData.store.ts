import { atom } from "nanostores"
import type { 
	Tickets, 
	Customers, 
	Locations, 
	Starships, 
	Messages, 
	Employees 
} from "../types.ts"

/**
 * A nano store that holds an array of tickets.
 */
export const ticketsStore = atom<Tickets[] | null>([])

/**
 * A nano store that holds an array of customers.
 */
export const customersStore = atom<Customers[] | null>([])

/**
 * A nano store that holds an array of locations.
 */
export const locationsStore = atom<Locations[] | null>([])

/**
 * A nano store that holds an array of starships.
 */
export const starshipsStore = atom<Starships[] | null>([])

/**
 * A nano store that holds an array of messages.
 */
export const messagesStore = atom<Messages[] | null>([])

/**
 * A nano store that holds an array of employees.
 */
export const employeesStore = atom<Employees[] | null>([])

/**
 * A function that resets all grid stores to their initial state.
 * This is useful for clearing the data in the stores when needed.
 */
export const resetAllGridStores = () => {
	ticketsStore.set([])
	customersStore.set([])
	locationsStore.set([])
	starshipsStore.set([])
	messagesStore.set([])
	employeesStore.set([])
}