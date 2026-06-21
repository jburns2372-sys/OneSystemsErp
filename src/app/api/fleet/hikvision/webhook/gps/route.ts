import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// MOCK: Webhook security token (should be in env)
const WEBHOOK_SECRET = process.env.HIKVISION_WEBHOOK_SECRET || 'dev_secret';

export async function POST(req: Request) {
  try {
    // Basic Security Check
    const authHeader = req.headers.get('Authorization') || req.headers.get('X-Hikvision-Signature');
    if (!authHeader || authHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    // EXPECTED PAYLOAD FORMAT (Normalized or Gateway generic):
    // {
    //   "deviceSerialNumber": "DS-M5504HNI-123456789",
    //   "timestamp": "2026-06-21T10:00:00Z",
    //   "latitude": 14.5995,
    //   "longitude": 120.9842,
    //   "speedKph": 45.2,
    //   "heading": 120,
    //   "satelliteCount": 8,
    //   "ignitionStatus": true
    // }

    const { 
      deviceSerialNumber, 
      timestamp, 
      latitude, 
      longitude, 
      speedKph, 
      heading, 
      satelliteCount, 
      ignitionStatus 
    } = payload;

    if (!deviceSerialNumber || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required GNSS payload fields' }, { status: 400 });
    }

    // 1. Identify the device and linked equipment
    const device = await prisma.hikvisionDevice.findUnique({
      where: { deviceSerialNumber },
      include: { equipment: true }
    });

    if (!device) {
      return NextResponse.json({ error: 'Unknown device serial number' }, { status: 404 });
    }

    // 2. Insert into generic Telemetry table (Internal Normalization)
    const telemetry = await prisma.equipmentTelemetry.create({
      data: {
        equipmentId: device.equipmentId!,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        latitude,
        longitude,
        speed: speedKph,
        heading,
        satelliteCount,
        ignitionStatus,
        locationSource: 'HIKVISION_GNSS',
        engineState: ignitionStatus ? (speedKph > 0 ? 'MOVING' : 'IDLE') : 'OFF',
        rawPayloadJson: JSON.stringify(payload)
      }
    });

    // 3. Update Device last seen & last GPS
    await prisma.hikvisionDevice.update({
      where: { id: device.id },
      data: { 
        lastSeenAt: new Date(),
        lastGpsAt: new Date(),
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({ success: true, telemetryId: telemetry.id });

  } catch (error: any) {
    console.error('Hikvision GPS Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
