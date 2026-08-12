'use server'

import { prisma } from '@/lib/prisma'

export async function registerPrismaUser(email: string, isRider: boolean) {
  if (isRider) {
    await prisma.user.upsert({
      where: { email },
      update: { role: 'RIDER' },
      create: {
        email,
        role: 'RIDER'
      }
    })
  }
}
