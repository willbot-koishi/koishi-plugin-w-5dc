import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
	plugins: [ viteSingleFile() ],
	base: './',
	optimizeDeps: {
		include: [ '5d-chess-js', '5d-chess-renderer' ]
	},
	build: {
		commonjsOptions: {
			include: [ /5d-chess/ ]
		}
	}
})