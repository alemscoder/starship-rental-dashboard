import { defineConfig } from "astro/config"
import node from "@astrojs/node"
import vercel from "@astrojs/vercel/serverless"

// https://astro.build/config
export default defineConfig({
	devToolbar: {
		enabled: false
	},
	output: "server",
	adapter: import.meta.env.PROD ? vercel() : node({ mode: "standalone" })
})
