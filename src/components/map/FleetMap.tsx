'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons in Next.js/Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface RiderLocation {
  deviceId: string
  boxLabel: string
  lat: number
  lng: number
  tempC: number
  humidityPct: number
  lastSeen: string
  status: string
}

export default function FleetMap({ initialData }: { initialData: RiderLocation[] }) {
  const [locations, setLocations] = useState<RiderLocation[]>(initialData)

  const center: [number, number] = locations.length > 0 ? [locations[0].lat, locations[0].lng] : [37.7749, -122.4194]

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc) => (
        <Marker key={loc.deviceId} position={[loc.lat, loc.lng]} icon={icon}>
          <Popup>
            <div className="font-semibold">{loc.boxLabel}</div>
            <div className="text-sm text-gray-600">Status: {loc.status}</div>
            <div className="text-sm text-gray-600">Temp: {loc.tempC}°C</div>
            <div className="text-sm text-gray-600">Humidity: {loc.humidityPct}%</div>
            <div className="text-xs text-gray-400 mt-1">
              Last seen: {new Date(loc.lastSeen).toLocaleTimeString()}
            </div>
            <a href={`/admin/fleet/${loc.deviceId}`} className="text-blue-500 hover:underline text-sm block mt-2">
              View Details &rarr;
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
