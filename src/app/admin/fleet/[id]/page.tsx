import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TelemetryChart from '@/components/charts/TelemetryChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function RiderDetailPage({ params }: { params: { id: string } }) {
  const device = await prisma.device.findUnique({
    where: { id: params.id },
    include: {
      rider: true,
      telemetry: {
        orderBy: { timestamp: 'desc' },
        take: 24 // Mocking 24h of data by taking last 24 records
      },
      panelSelections: {
        include: {
          currentAd: true
        }
      }
    }
  })

  if (!device) {
    notFound()
  }

  // Format telemetry for the chart component
  const telemetryData = device.telemetry.map(t => ({
    timestamp: t.timestamp.toISOString(),
    tempC: t.tempC,
    humidityPct: t.humidityPct
  }))

  const frontAd = device.panelSelections.find(p => p.panel === 'FRONT')?.currentAd
  const leftAd = device.panelSelections.find(p => p.panel === 'LEFT')?.currentAd
  const rightAd = device.panelSelections.find(p => p.panel === 'RIGHT')?.currentAd

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{device.boxLabel}</h2>
          <p className="text-muted-foreground mt-1">
            Rider: {device.rider?.name || 'Unassigned'} ({device.rider?.email || 'N/A'})
          </p>
        </div>
        <Badge variant={device.status === 'ONLINE' ? 'default' : 'secondary'} className="text-sm">
          {device.status}
        </Badge>
      </div>

      {device.telemetry.length > 0 && device.telemetry[0].tempC > 55 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md">
          <strong className="font-semibold">High Temperature Alert:</strong> The internal box temperature is {device.telemetry[0].tempC}°C, exceeding the safe limit of 55°C.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TelemetryChart data={telemetryData} />
          
          <Card>
            <CardHeader>
              <CardTitle>Location History</CardTitle>
              <CardDescription>Map trail of the last hour (Placeholder for path map)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-md border">
              <span className="text-muted-foreground">Map rendering...</span>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Advertisements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-500">Front Panel</div>
                {frontAd ? (
                  <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <img src={frontAd.mediaUrl} alt="" className="w-12 h-12 object-cover rounded" />
                    <span className="text-sm font-medium">{frontAd.title}</span>
                  </div>
                ) : <div className="text-sm text-slate-400 p-2 border border-dashed rounded">None selected</div>}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-500">Left Panel</div>
                {leftAd ? (
                  <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <img src={leftAd.mediaUrl} alt="" className="w-12 h-12 object-cover rounded" />
                    <span className="text-sm font-medium">{leftAd.title}</span>
                  </div>
                ) : <div className="text-sm text-slate-400 p-2 border border-dashed rounded">None selected</div>}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-500">Right Panel</div>
                {rightAd ? (
                  <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <img src={rightAd.mediaUrl} alt="" className="w-12 h-12 object-cover rounded" />
                    <span className="text-sm font-medium">{rightAd.title}</span>
                  </div>
                ) : <div className="text-sm text-slate-400 p-2 border border-dashed rounded">None selected</div>}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
