import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Checking if Device table exists...')
  try {
    const devices = await prisma.device.findMany()
    console.log('Success! Devices found:', devices.length)
  } catch (err: any) {
    console.error('Error fetching devices:', err.message)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
