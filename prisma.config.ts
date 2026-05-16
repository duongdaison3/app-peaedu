import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, env } from '@prisma/config'

function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf8')

    for (const line of content.split(/\r?\n/)) {
      const trimmedLine = line.trim()

      if (!trimmedLine || trimmedLine.startsWith('#')) continue

      const equalsIndex = trimmedLine.indexOf('=')
      if (equalsIndex === -1) continue

      const key = trimmedLine.slice(0, equalsIndex).trim()
      if (process.env[key]) continue

      let value = trimmedLine.slice(equalsIndex + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      process.env[key] = value
    }
  } catch {
    // Ignore missing env files; Prisma will use already provided environment variables.
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile(resolve(process.cwd(), '.env'))

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env('DIRECT_URL'),
  },
})
