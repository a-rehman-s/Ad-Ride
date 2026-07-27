'use client'

import { useState } from 'react'
import { selectAd } from '@/app/actions/adActions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Ad {
  id: string
  title: string
  mediaUrl: string
  mediaType: string
  targetPanel: string
}

interface AdSelectionGridProps {
  ads: Ad[]
  currentAdId?: string
  panel: 'FRONT' | 'LEFT' | 'RIGHT'
  deviceId: string
  userId: string
}

export default function AdSelectionGrid({ ads, currentAdId, panel, deviceId, userId }: AdSelectionGridProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleSelect = async (adId: string) => {
    if (adId === currentAdId) return
    setLoadingId(adId)
    await selectAd(deviceId, panel, adId, userId)
    setLoadingId(null)
  }

  const filteredAds = ads.filter(ad => ad.targetPanel === panel || ad.targetPanel === 'ANY')

  if (filteredAds.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">No approved ads available for this panel.</div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {filteredAds.map((ad) => {
        const isActive = ad.id === currentAdId
        return (
          <Card 
            key={ad.id} 
            className={`cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-blue-400 ${isActive ? 'ring-4 ring-green-500' : ''}`}
            onClick={() => handleSelect(ad.id)}
          >
            <div className="relative aspect-[7/8] bg-slate-100 flex items-center justify-center">
              {ad.mediaType === 'IMAGE' ? (
                <img src={ad.mediaUrl} alt={ad.title} className="object-cover w-full h-full" />
              ) : (
                <div className="text-slate-400">Video</div>
              )}
              {isActive && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                  ACTIVE
                </div>
              )}
              {loadingId === ad.id && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <div className="text-sm font-medium truncate" title={ad.title}>{ad.title}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
