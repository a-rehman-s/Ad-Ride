'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function selectAd(deviceId: string, panel: 'FRONT' | 'LEFT' | 'RIGHT' | 'ANY', adId: string, updatedBy: string) {
  try {
    await prisma.panelSelection.upsert({
      where: {
        deviceId_panel: {
          deviceId,
          panel: panel === 'ANY' ? 'FRONT' : panel, // ANY isn't a valid specific panel location, fallback to FRONT if somehow passed
        }
      },
      update: {
        currentAdId: adId,
        updatedBy,
      },
      create: {
        deviceId,
        panel: panel === 'ANY' ? 'FRONT' : panel,
        currentAdId: adId,
        updatedBy,
      }
    })

    revalidatePath('/rider/ads')
    revalidatePath('/rider')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Failed to select ad:', error)
    return { error: 'Failed to update selection' }
  }
}
