import { defineConfig } from '@tanstack/react-start/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  server: {
    prerender: {
      routes: ['/', '/comunicados', '/membros', '/noticias', '/ratings', '/sobre', '/titulados', '/links'],
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
