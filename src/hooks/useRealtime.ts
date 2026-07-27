'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to listen to Supabase Realtime changes and refresh the Next.js router.
 * 
 * IMPORTANT: To use this, you must enable Realtime for the 'Telemetry' and 'Device' 
 * tables in your Supabase Dashboard (Database -> Replication -> Enable).
 */
export function useRealtime() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        (payload) => {
          console.log('Realtime update received!', payload)
          // Refresh the current route to fetch the latest server-side data
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router])
}
