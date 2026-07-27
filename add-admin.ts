import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.user.upsert({
    where: { email: 'abdurrehmansaeed709@gmail.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'abdurrehmansaeed709@gmail.com',
      name: 'Abdur Rehman Saeed',
      role: 'ADMIN'
    }
  })
  console.log('User created as ADMIN')
}

main().catch(console.error).finally(() => prisma.$disconnect())
