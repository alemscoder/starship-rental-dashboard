import jwt from "jsonwebtoken"
import { serverClient, cookieProdOptions } from "@lib/server"
import type { APIContext, APIRoute } from "astro"

const SECRET_JWT_KEY = import.meta.env.SECRET_JWT_KEY
const JWT_EXPIRE_TIME = import.meta.env.JWT_EXPIRE_TIME

export const GET: APIRoute = async (context: APIContext) => {
	const supabase = serverClient(context)
	const authCode = context.url.searchParams.get("code")
	if (!authCode) {
		return new Response("No code provided", { status: 400 })
	}
	const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)
	if (error) {
		return new Response(error.message, { status: 500 })
	}
	const userAccessToken = jwt.sign(
		{ id: data.user?.id },
		SECRET_JWT_KEY,
		{ expiresIn: Number(JWT_EXPIRE_TIME) }
	)
	context.cookies.set("user-access-token", userAccessToken, cookieProdOptions)
	return context.redirect("/rentals/tickets")
}
