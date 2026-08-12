'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRole: Role) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if the current user is an ADMIN
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email },
  })

  if (currentUser?.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Prevent admin from demoting themselves to avoid locking out the only admin
  if (currentUser.id === userId && newRole !== 'ADMIN') {
    throw new Error('Cannot change your own role from ADMIN')
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  })

  revalidatePath('/admin/users')
}
