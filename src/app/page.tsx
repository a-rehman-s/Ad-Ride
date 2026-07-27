import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user role from database
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  })

  if (dbUser?.role === 'ADMIN') {
    redirect('/admin')
  } else if (dbUser?.role === 'RIDER') {
    redirect('/rider')
  }

  // Fallback if role is missing but user is logged in
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Role Not Configured</h1>
        <p>Please contact an administrator to assign a role to your account.</p>
        <p className="text-sm text-gray-500 mt-2">({user.email})</p>
      </div>
    </div>
  )
}
