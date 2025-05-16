/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly PUBLIC_SUPABASE_URL: string
	readonly PUBLIC_SUPABASE_ANON_KEY: string
	readonly SERVICE_ROLE: string
	readonly SECRET_JWT_KEY: string
	readonly JWT_EXPIRE_TIME: number | string
	readonly UPSTASH_REDIS_REST_URL: string
	readonly UPSTASH_REDIS_REST_TOKEN: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
