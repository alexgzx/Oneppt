import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const RENDERER_SERVER_PORT = 5178

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        external: [
          'electron',
          '@node-rs/jieba',
          /@node-rs\/.*/,
          '@libsql/client',
          /@libsql\/.*/,
          'libsql',
          '@neon-rs/load',
          /@neon-rs\/.*/,
          'openai',
          '@langchain/openai',
          '@langchain/google-genai',
          '@langchain/anthropic',
          '@google/genai'
        ]
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        external: [
          'electron',
          '@node-rs/jieba',
          /@node-rs\/.*/,
          '@libsql/client',
          /@libsql\/.*/,
          'libsql',
          '@neon-rs/load',
          /@neon-rs\/.*/,
          'openai',
          '@langchain/openai',
          '@langchain/google-genai',
          '@langchain/anthropic',
          '@google/genai'
        ]
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    server: {
      port: RENDERER_SERVER_PORT,
      strictPort: false,
      host: '0.0.0.0'
    },
    preview: {
      port: RENDERER_SERVER_PORT,
      strictPort: false
    },
    plugins: [react()]
  }
})
