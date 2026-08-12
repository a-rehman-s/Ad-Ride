'use client'

import { useState } from 'react'
import { Role } from '@prisma/client'
import { updateUserRole } from '@/app/actions/userActions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UserRoleSelectProps {
  userId: string
  currentRole: Role
}

export default function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const [loading, setLoading] = useState(false)

  const handleRoleChange = async (newRole: Role) => {
    setLoading(true)
    try {
      await updateUserRole(userId, newRole)
    } catch (error: any) {
      alert(error.message || 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select disabled={loading} defaultValue={currentRole} onValueChange={(val) => handleRoleChange(val as Role)}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ADMIN">Admin</SelectItem>
        <SelectItem value="RIDER">Rider</SelectItem>
      </SelectContent>
    </Select>
  )
}
