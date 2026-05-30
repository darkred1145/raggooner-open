import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import type { Plugin } from 'vite'

function reorderHeadPlugin(): Plugin {
  return {
    name: 'reorder-head',
    enforce: 'post',
    transformIndexHtml(html: string) {
      // Make external resources non-blocking so the parser reaches
      // the Vite-injected CSS link before first paint
      html = html.replace(
        '<script src="https://unpkg.com/@phosphor-icons/web"></script>',
        '<script src="https://unpkg.com/@phosphor-icons/web" defer></script>',
      )
      html = html.replace(
        '<link href="https://fonts.googleapis.com/css2?family=Teko:wght@300;400;600;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Teko:wght@300;400;600;700&family=Inter:wght@300;400;600&display=swap">\n    <link href="https://fonts.googleapis.com/css2?family=Teko:wght@300;400;600;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">',
      )
      return html
    },
  }
}

export default defineConfig({
  plugins: [vue(), reorderHeadPlugin()],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'scripts/',
        'src/firebase.ts',
        '**/*.test.ts',
        '**/*.d.ts'
      ]
    }
  },
  build: {
    chunkSizeWarningLimit: 1000
  }
})
