import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Film } from 'lucide-react'
import UploadAdDialog from '@/components/ads/UploadAdDialog'

export default async function AdManagementPage() {
  const ads = await prisma.ad.findMany({
    orderBy: { createdAt: 'desc' },
    include: { uploader: true }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ad Library</h2>
          <p className="text-muted-foreground">Manage and upload creative assets for the fleet.</p>
        </div>
        <UploadAdDialog />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {ads.map((ad) => (
          <Card key={ad.id} className="overflow-hidden flex flex-col">
            <div className="relative aspect-[7/8] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
              {ad.mediaType === 'IMAGE' ? (
                // Using standard img tag because domains are not configured in next.config.ts yet
                <img src={ad.mediaUrl} alt={ad.title} className="object-cover w-full h-full" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Film className="h-12 w-12 mb-2" />
                  <span>Video</span>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {ad.targetPanel}
              </div>
            </div>
            <CardHeader className="p-4 pb-0 flex-1">
              <CardTitle className="text-base truncate" title={ad.title}>{ad.title}</CardTitle>
              <CardDescription className="text-xs">
                {ad.status} &bull; Uploaded by {ad.uploader?.name || 'Unknown'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-4">
              <Button variant="outline" className="w-full text-xs" size="sm">
                Archive
              </Button>
            </CardContent>
          </Card>
        ))}
        {ads.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No ads found. Upload your first creative!
          </div>
        )}
      </div>
    </div>
  )
}
