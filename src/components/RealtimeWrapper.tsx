'use client'

import { useRealtime } from '@/hooks/useRealtime'

export default function RealtimeWrapper() {
  useRealtime()
  return null // This component doesn't render anything, it just sets up the listener
}
