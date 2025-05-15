import { defineConfig } from '@tanstack/react-start/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  server: {
    prerender: {
      routes: ['/', "/campeoes", "/circuitos", "/comunicados", "/membros", "/noticias", "/ratings", "/sobre", "/titulados"],
      crawlLinks: true,
    },
  },
  tsr: {
    appDirectory: 'src',
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
  },
})