import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  // Only use PrismaLibSql adapter if we're not using PostgreSQL
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    const adapter = new PrismaPg({ connectionString: url })
    return new PrismaClient({ adapter })
  }

  const adapter = new PrismaLibSql({ url })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
