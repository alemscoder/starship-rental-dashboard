import { auth } from "./auth.actions.ts"
import { session } from "./session.actions.ts"
import { employee } from "./employee.actions.ts"

export const server = {
	auth,
	session,
	employee
}
