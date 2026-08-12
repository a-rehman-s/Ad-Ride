import 'dotenv/config'
import { PrismaClient, Role, DeviceStatus, PanelType, MediaType } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const DEFAULT_PASSWORD = 'Password123!'

async function createAuthUser(email: string) {
  // We use gen_random_uuid() and crypt() from Postgres to insert users directly into Supabase Auth
  // bypassing any email rate limits.
  const result: any = await prisma.$queryRawUnsafe(`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
      '${email}', crypt('${DEFAULT_PASSWORD}', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now()
    )
    RETURNING id;
  `)
  return result[0].id
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
    console.log('Supabase auth.users cleared.')
  } catch (err) {
    console.log('Could not clear auth.users (might lack permissions or already empty).')
  }

  // 3. Create Users
  console.log(`Creating users in auth.users and Prisma with password: ${DEFAULT_PASSWORD}`)
  
  // Create Admin
  const adminAuthId = await createAuthUser('admin@adbox.com')
  const admin = await prisma.user.create({
    data: { email: 'admin@adbox.com', name: 'Admin User', role: Role.ADMIN }
  })
  
  // Create Rider 1
  const rider1AuthId = await createAuthUser('rider1@adbox.com')
  const rider1 = await prisma.user.create({
    data: { email: 'rider1@adbox.com', name: 'Alice Rider', role: Role.RIDER }
  })
  
  // Create Rider 2
  const rider2AuthId = await createAuthUser('rider2@adbox.com')
  const rider2 = await prisma.user.create({
    data: { email: 'rider2@adbox.com', name: 'Bob Rider', role: Role.RIDER }
  })

  // 4. Create Devices
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

  // 5. Create Ads
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

  // 6. Create Panel Selections
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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
