import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// The web build is a Node server: it hosts the UI and the /api endpoints
		// that both the browser and the Tauri desktop app talk to.
		adapter: adapter()
	}
};

export default config;
