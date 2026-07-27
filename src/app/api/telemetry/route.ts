import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/* 
 * ESP32 Hardware Integration Stub
 * 
 * Expected JSON payload from ESP32:
 * {
 *   "deviceId": "DEV-ESP32-001",
 *   "lat": 37.7749,
 *   "lng": -122.4194,
 *   "tempC": 42.5,
 *   "humidityPct": 35.0,
 *   "speed": 12.5
 * }
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { deviceId, lat, lng, tempC, humidityPct, speed } = body

    if (!deviceId || lat === undefined || lng === undefined || tempC === undefined || humidityPct === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the device exists
    const device = await prisma.device.findUnique({
      where: { id: deviceId }
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    // 1. Insert Telemetry Data
    const telemetry = await prisma.telemetry.create({
      data: {
        deviceId,
        lat: Number(lat),
        lng: Number(lng),
        tempC: Number(tempC),
        humidityPct: Number(humidityPct),
        speed: speed ? Number(speed) : 0,
      }
    })

    // 2. Update Device lastSeen and status
    await prisma.device.update({
      where: { id: deviceId },
      data: { 
        lastSeen: new Date(),
        status: 'ONLINE' 
      }
    })

    return NextResponse.json({ success: true, telemetryId: telemetry.id }, { status: 201 })
  } catch (error) {
    console.error('Telemetry ingestion error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
