import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    const users = await prisma.user.findMany()
    console.log("Users in DB:", users)
    console.log("Successfully connected using DATABASE_URL!")
  } catch (error) {
    console.error("Connection Error:", error)
  }
}

main().finally(() => prisma.$disconnect())
