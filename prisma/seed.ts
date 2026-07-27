import { PrismaClient, Role, DeviceStatus, PanelType, MediaType, AdStatus } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting seed...')

  // Clear existing data
  await prisma.panelSelection.deleteMany()
  await prisma.telemetry.deleteMany()
  await prisma.ad.deleteMany()
  await prisma.device.deleteMany()
  await prisma.user.deleteMany()

  // 1. Create Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@adbox.com',
      name: 'Admin User',
      role: Role.ADMIN,
    },
  })

  // 2. Create Rider Users
  const rider1 = await prisma.user.create({
    data: {
      email: 'rider1@adbox.com',
      name: 'Alice Rider',
      role: Role.RIDER,
    },
  })

  const rider2 = await prisma.user.create({
    data: {
      email: 'rider2@adbox.com',
      name: 'Bob Rider',
      role: Role.RIDER,
    },
  })

  // 3. Create Devices
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

  // 4. Create Ads
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
  
  const ad3 = await prisma.ad.create({
    data: {
      title: 'Local Pizza Shop',
      mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
      mediaType: MediaType.IMAGE,
      targetPanel: PanelType.RIGHT,
      uploadedBy: admin.id,
    },
  })

  // 5. Create Panel Selections
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

  // 6. Create some mock telemetry
  await prisma.telemetry.createMany({
    data: [
      {
        deviceId: device1.id,
        lat: 37.7749,
        lng: -122.4194,
        tempC: 45.2,
        humidityPct: 30.5,
        speed: 15.2,
      },
      {
        deviceId: device2.id,
        lat: 37.7849,
        lng: -122.4094,
        tempC: 38.1,
        humidityPct: 40.0,
        speed: 0.0,
      }
    ]
  })

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
