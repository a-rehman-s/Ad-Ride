import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    const identities: any = await prisma.$queryRawUnsafe(`SELECT * FROM auth.identities;`)
    console.log("Identities:", identities)
  } catch (error) {
    console.error("Error:", error)
  }
}

main().finally(() => prisma.$disconnect())
