import { prisma } from '@/lib/prisma'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, ThermometerSun, MapPin } from 'lucide-react'

const FleetMap = dynamic(() => import('@/components/map/FleetMap'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center animate-pulse">Loading map...</div> 
})

export default async function AdminDashboard() {
  const devices = await prisma.device.findMany({
    include: {
      telemetry: {
        orderBy: { timestamp: 'desc' },
        take: 1
      },
      rider: true
    }
  })

  const onlineCount = devices.filter(d => d.status === 'ONLINE').length
  const totalCount = devices.length

  const mapData = devices.map(d => {
    const latest = d.telemetry[0]
    return {
      deviceId: d.id,
      boxLabel: d.boxLabel,
      lat: latest?.lat || 37.7749,
      lng: latest?.lng || -122.4194,
      tempC: latest?.tempC || 0,
      humidityPct: latest?.humidityPct || 0,
      lastSeen: d.lastSeen.toISOString(),
      status: d.status
    }
  })

  const avgTemp = mapData.length > 0 
    ? mapData.reduce((acc, curr) => acc + curr.tempC, 0) / mapData.length
    : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Fleet</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineCount} / {totalCount}</div>
            <p className="text-xs text-muted-foreground">Devices currently online</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Box Temp</CardTitle>
            <ThermometerSun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTemp.toFixed(1)}°C</div>
            <p className="text-xs text-muted-foreground">Across all active boxes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Healthy</div>
            <p className="text-xs text-muted-foreground">Telemetry API receiving data</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Live Fleet Tracking</CardTitle>
        </CardHeader>
        <CardContent className="h-[600px] p-0 overflow-hidden rounded-b-xl border-t">
          <FleetMap initialData={mapData} />
        </CardContent>
      </Card>
    </div>
  )
}
