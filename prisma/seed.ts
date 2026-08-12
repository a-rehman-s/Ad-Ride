import 'dotenv/config'
import { PrismaClient, Role, DeviceStatus, PanelType, MediaType } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DEFAULT_PASSWORD = 'Password123!'

async function signUpUser(email: string, name: string, role: Role) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: DEFAULT_PASSWORD,
    options: {
      data: { name }
    }
  })

  if (error) {
    console.log(`Supabase sign up failed for ${email}: ${error.message}`)
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, role }
  })
  return user
}

async function main() {
  console.log('Starting full reset...')
  
  // 1. Delete Prisma Data
  await prisma.panelSelection.deleteMany()
  await prisma.telemetry.deleteMany()
  await prisma.ad.deleteMany()
  await prisma.device.deleteMany()
  await prisma.user.deleteMany()
  console.log('Prisma data cleared.')

  // 2. Delete Supabase Auth Users
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM auth.users;`)
    console.log('Supabase auth.users cleared (bypassed corrupted users).')
  } catch (err) {
    console.log('Could not clear auth.users (might lack permissions or already empty).')
  }

  // 3. Create Users with unique emails to bypass rate limits!
  console.log(`Creating users with standard API to prevent 500 Errors...`)
  const rand = Math.floor(Math.random() * 10000)
  
  const adminEmail = `admin_${rand}@adbox.com`
  const rider1Email = `rider1_${rand}@adbox.com`
  const rider2Email = `rider2_${rand}@adbox.com`

  const admin = await signUpUser(adminEmail, 'Admin User', Role.ADMIN)
  const rider1 = await signUpUser(rider1Email, 'Alice Rider', Role.RIDER)
  const rider2 = await signUpUser(rider2Email, 'Bob Rider', Role.RIDER)

  // 4. Auto-confirm emails just in case Supabase has it enabled
  try {
    await prisma.$executeRawUnsafe(`UPDATE auth.users SET email_confirmed_at = NOW();`)
    console.log('Emails auto-confirmed.')
  } catch(err) {}

  // 5. Create Devices
  const device1 = await prisma.device.create({
    data: {
      id: 'DEV-ESP32-001',
      riderId: rider1.id,
      boxLabel: 'Box-Alpha',
      status: DeviceStatus.ONLINE,
    },
  })

  const device2 = await prisma.device.create({
    data: {
      id: 'DEV-ESP32-002',
      riderId: rider2.id,
      boxLabel: 'Box-Beta',
      status: DeviceStatus.ONLINE,
    },
  })

  // 6. Create Ads
  const ad1 = await prisma.ad.create({
    data: {
      title: 'Coca Cola Summer Promo',
      mediaUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97',
      mediaType: MediaType.IMAGE,
      targetPanel: PanelType.FRONT,
      uploadedBy: admin.id,
    },
  })

  const ad2 = await prisma.ad.create({
    data: {
      title: 'Nike Just Do It',
      mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      mediaType: MediaType.IMAGE,
      targetPanel: PanelType.ANY,
      uploadedBy: admin.id,
    },
  })

  // 7. Create Panel Selections
  await prisma.panelSelection.create({
    data: {
      deviceId: device1.id,
      panel: PanelType.FRONT,
      currentAdId: ad1.id,
      updatedBy: rider1.id,
    },
  })
  
  await prisma.panelSelection.create({
    data: {
      deviceId: device1.id,
      panel: PanelType.LEFT,
      currentAdId: ad2.id,
      updatedBy: rider1.id,
    },
  })

  console.log('Database successfully reset and seeded with passwords!')
  console.log('----------------------------------------------------')
  console.log('PLEASE USE THESE NEW CREDENTIALS TO LOGIN:')
  console.log(`Admin: ${adminEmail}`)
  console.log(`Rider 1: ${rider1Email}`)
  console.log(`Rider 2: ${rider2Email}`)
  console.log(`Password: ${DEFAULT_PASSWORD}`)
  console.log('----------------------------------------------------')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
