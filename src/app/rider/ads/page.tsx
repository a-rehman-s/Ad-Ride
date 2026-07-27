import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AdSelectionGrid from '@/components/ads/AdSelectionGrid'

export default async function RiderAdsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      devices: {
        include: {
          panelSelections: true
        }
      }
    }
  })

  const device = dbUser?.devices[0]

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">No Device Assigned</h2>
      </div>
    )
  }

  // Fetch all active ads
  const activeAds = await prisma.ad.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' }
  })

  const getActiveAdId = (panelType: string) => {
    return device.panelSelections.find(p => p.panel === panelType)?.currentAdId
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Select Advertisements</h2>
        <p className="text-muted-foreground">Choose which ads to display on your AdBox panels.</p>
      </div>

      <Tabs defaultValue="FRONT" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="FRONT">Front Panel</TabsTrigger>
          <TabsTrigger value="LEFT">Left Panel</TabsTrigger>
          <TabsTrigger value="RIGHT">Right Panel</TabsTrigger>
        </TabsList>
        
        <TabsContent value="FRONT">
          <AdSelectionGrid 
            ads={activeAds} 
            panel="FRONT" 
            deviceId={device.id} 
            userId={dbUser.id} 
            currentAdId={getActiveAdId('FRONT')} 
          />
        </TabsContent>
        <TabsContent value="LEFT">
          <AdSelectionGrid 
            ads={activeAds} 
            panel="LEFT" 
            deviceId={device.id} 
            userId={dbUser.id} 
            currentAdId={getActiveAdId('LEFT')} 
          />
        </TabsContent>
        <TabsContent value="RIGHT">
          <AdSelectionGrid 
            ads={activeAds} 
            panel="RIGHT" 
            deviceId={device.id} 
            userId={dbUser.id} 
            currentAdId={getActiveAdId('RIGHT')} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
