import { existsSync } from 'node:fs'
import dotenv from 'dotenv'
import { defineConfig, env } from 'prisma/config'

if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' })
}

if (existsSync('.env')) {
  dotenv.config({ path: '.env' })
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
