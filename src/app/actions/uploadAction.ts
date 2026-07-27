'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createAdRecord(title: string, mediaUrl: string, mediaType: 'IMAGE' | 'VIDEO', targetPanel: 'FRONT' | 'LEFT' | 'RIGHT' | 'ANY') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    const newAd = await prisma.ad.create({
      data: {
        title,
        mediaUrl,
        mediaType,
        targetPanel,
        status: 'ACTIVE',
        uploadedById: dbUser.id
      }
    })

    revalidatePath('/admin/ads')
    revalidatePath('/rider/ads')
    return { success: true, adId: newAd.id }
  } catch (error) {
    console.error('Failed to create ad record:', error)
    return { error: 'Failed to create ad record' }
  }
}
