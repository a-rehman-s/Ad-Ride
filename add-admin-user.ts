import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
  const email = 'admin@gmail.com'
  const password = '123456'

  console.log(`Creating user in Supabase: ${email}`)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('User already registered')) {
      console.log('User already exists in Supabase. Skipping Supabase creation.')
    } else {
      console.error('Supabase Error:', error.message)
      throw error
    }
  } else {
    console.log('Successfully created user in Supabase.')
  }

  console.log(`Upserting user in Prisma database: ${email}`)
  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      email,
      name: 'Admin',
      role: 'ADMIN'
    }
  })
  
  console.log('Successfully set user as ADMIN in Prisma database.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
