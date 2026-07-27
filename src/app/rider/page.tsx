import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThermometerSun, Activity, MapPin } from 'lucide-react'
import TelemetryChart from '@/components/charts/TelemetryChart'
import MapWrapper from '@/components/map/MapWrapper'

export default async function RiderDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      devices: {
        include: {
          telemetry: {
            orderBy: { timestamp: 'desc' },
            take: 24
          }
        }
      }
    }
  })

  const device = dbUser?.devices[0] // Assuming one device per rider for simplicity

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">No Device Assigned</h2>
        <p className="text-muted-foreground">Please ask your admin to assign an AdBox to your account.</p>
      </div>
    )
  }

  const latestTelemetry = device.telemetry[0]

  const mapData = [{
    deviceId: device.id,
    boxLabel: device.boxLabel,
    lat: latestTelemetry?.lat || 37.7749,
    lng: latestTelemetry?.lng || -122.4194,
    tempC: latestTelemetry?.tempC || 0,
    humidityPct: latestTelemetry?.humidityPct || 0,
    lastSeen: device.lastSeen.toISOString(),
    status: device.status
  }]

  const chartData = device.telemetry.map(t => ({
    timestamp: t.timestamp.toISOString(),
    tempC: t.tempC,
    humidityPct: t.humidityPct
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome, {dbUser?.name}</h2>
          <p className="text-muted-foreground">My Device: {device.boxLabel}</p>
        </div>
        <Badge variant={device.status === 'ONLINE' ? 'default' : 'secondary'}>
          {device.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Box Temp</CardTitle>
            <ThermometerSun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${latestTelemetry?.tempC > 55 ? 'text-red-500' : ''}`}>
              {latestTelemetry?.tempC ? `${latestTelemetry.tempC}°C` : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Box Humidity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestTelemetry?.humidityPct ? `${latestTelemetry.humidityPct}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Speed</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestTelemetry?.speed ? `${latestTelemetry.speed} km/h` : '0 km/h'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Location</CardTitle>
            <CardDescription>Live map tracking</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] p-0 overflow-hidden rounded-b-xl border-t">
            <MapWrapper initialData={mapData} />
          </CardContent>
        </Card>

        <TelemetryChart data={chartData} />
      </div>
    </div>
  )
}
