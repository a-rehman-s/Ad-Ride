'use client'

import dynamic from 'next/dynamic'

const FleetMap = dynamic(() => import('./FleetMap'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center animate-pulse">Loading map...</div> 
})

export default function MapWrapper({ initialData }: { initialData: any[] }) {
  return <FleetMap initialData={initialData} />
}
