export const DEMO_USERS = [
	{
		"email": "maya.orion@starshiprentals.com",
		"first_name": "Maya",
		"last_name": "Orion",
		"job_title": "Customer Support"
	},
	{
		"email": "ethan.vega@starshiprentals.com",
		"first_name": "Ethan",
		"last_name": "Vega",
		"job_title": "Maintenance Engineer"
	},
	{
		"email": "zara.quasar@starshiprentals.com",
		"first_name": "Zara",
		"last_name": "Quasar",
		"job_title": "Booking Specialist"
	},
	{
		"email": "noah.pulsar@starshiprentals.com",
		"first_name": "Noah",
		"last_name": "Pulsar",
		"job_title": "Logistics Coordinator"
	},
	{
		"email": "sophie.nebula@starshiprentals.com",
		"first_name": "Sophie",
		"last_name": "Nebula",
		"job_title": "HR Specialist"
	},
	{
		"email": "ava.stellar@starshiprentals.com",
		"first_name": "Ava",
		"last_name": "Stellar",
		"job_title": "Fleet Manager"
	},
	{
		"email": "isla.comet@starshiprentals.com",
		"first_name": "Isla",
		"last_name": "Comet",
		"job_title": "Marketing Lead"
	},
	{
		"email": "liam.nova@starshiprentals.com",
		"first_name": "Liam",
		"last_name": "Nova",
		"job_title": "Operations Lead"
	},
	{
		"email": "milo.astro@starshiprentals.com",
		"first_name": "Milo",
		"last_name": "Astro",
		"job_title": "Customer Support"
	},
	{
		"email": "lucas.cosmos@starshiprentals.com",
		"first_name": "Lucas",
		"last_name": "Cosmos",
		"job_title": "IT Administrator"
	}
]

export function isDemoUser(email: string): boolean {
	return DEMO_USERS.some(user => user.email === email)
}
