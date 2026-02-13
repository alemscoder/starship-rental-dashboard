import { atom } from "nanostores"
import type { 
	Ticket, 
	Customer, 
	Location, 
	Starship, 
	Message, 
	Employee 
} from "../types.ts"

/**
 * A nano store that holds an array of tickets.
 */
export const ticketsStore = atom<Ticket[] | null>([])

/**
 * A nano store that holds an array of customers.
 */
export const customersStore = atom<Customer[] | null>([])

/**
 * A nano store that holds an array of locations.
 */
export const locationsStore = atom<Location[] | null>([])

/**
 * A nano store that holds an array of starships.
 */
export const starshipsStore = atom<Starship[] | null>([])

/**
 * A nano store that holds an array of messages.
 */
export const messagesStore = atom<Message[] | null>([])

/**
 * A nano store that holds an array of employees.
 */
export const employeesStore = atom<Employee[] | null>([])

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