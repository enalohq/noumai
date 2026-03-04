import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a test user if none exists
  const existingUser = await prisma.user.findFirst({
    where: { email: 'test@example.com' }
  })

  if (!existingUser) {
    const hashedPassword = await hash('password123', 12)
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        emailVerified: new Date(),
      },
    })

    // Create a default workspace for the test user
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        description: 'Default workspace for testing',
        brandName: 'Test Brand',
        website: 'https://example.com',
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
    })

    console.log(`✅ Created test user: ${user.email}`)
    console.log(`✅ Created workspace: ${workspace.name}`)
  } else {
    console.log('✅ Test user already exists')
  }

  console.log('🌱 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })