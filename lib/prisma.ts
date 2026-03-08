import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  
  // In test environment, use a mock or in-memory database
  if (process.env.NODE_ENV === 'test' || !url) {
    // Return a minimal Prisma client for testing
    // Tests should mock this anyway
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
        },
      },
    })
  }
  
  // Only use adapters in production/development with actual database URLs
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    try {
      const { PrismaPg } = require('@prisma/adapter-pg')
      const adapter = new PrismaPg({ connectionString: url })
      return new PrismaClient({ adapter })
    } catch {
      // Fallback if adapter not available
      return new PrismaClient()
    }
  }

  // For SQLite/LibSQL
  try {
    const { PrismaLibSql } = require('@prisma/adapter-libsql')
    const adapter = new PrismaLibSql({ url })
    return new PrismaClient({ adapter })
  } catch {
    // Fallback if adapter not available
    return new PrismaClient()
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
