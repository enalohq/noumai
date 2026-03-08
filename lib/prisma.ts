import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  
  // Only use adapters in production/development with actual database URLs
  if (url && (url.startsWith('postgresql://') || url.startsWith('postgres://'))) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaPg } = require('@prisma/adapter-pg')
      const adapter = new PrismaPg({ connectionString: url })
      return new PrismaClient({ adapter })
    } catch {
      // Fallback if adapter not available
      return new PrismaClient()
    }
  }

  // For SQLite/LibSQL
  if (url && (url.startsWith('file:') || url.startsWith('libsql:'))) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaLibSql } = require('@prisma/adapter-libsql')
      const adapter = new PrismaLibSql({ url })
      return new PrismaClient({ adapter })
    } catch {
      // Fallback if adapter not available
      return new PrismaClient()
    }
  }

  // Default: use standard PrismaClient (DATABASE_URL from .env or schema)
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
