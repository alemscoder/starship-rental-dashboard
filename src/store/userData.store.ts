import { atom } from "nanostores"
import type { Employee as User } from "../types.ts"

/**
 * A nano store that holds the current log-in user data.
 */
export const userDataStore = atom<User | null>(null)
