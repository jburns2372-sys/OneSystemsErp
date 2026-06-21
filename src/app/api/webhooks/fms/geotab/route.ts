import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Webhook endpoint to receive Geotab telemetry payload
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Standard expected payload structure from FMS
    // {
    //   deviceId: string,
    //   timestamp: string,
    //   latitude: number,
    //   longitude: number,
    //   speed: number,
    //   engineState: string (IDLE, MOVING, OFF),
    //   odometer: number,
    //   engineHours: number,
    //   fuelLevel: number,
    //   faultCodes: [string, string]
    // }

    // 1. Identify Equipment by FMS Device ID
    const equipment = await prisma.equipment.findUnique({
      where: { fmsDeviceId: payload.deviceId }
    });

    if (!equipment) {
      return NextResponse.json({ error: `Equipment with deviceId ${payload.deviceId} not found.` }, { status: 404 });
    }

    // 2. Insert Telemetry Record
    await prisma.equipmentTelemetry.create({
      data: {
        equipmentId: equipment.id,
        timestamp: new Date(payload.timestamp || Date.now()),
        latitude: payload.latitude,
        longitude: payload.longitude,
        speed: payload.speed,
        engineState: payload.engineState,
        odometer: payload.odometer,
        engineHours: payload.engineHours,
        fuelLevel: payload.fuelLevel,
        faultCodes: payload.faultCodes ? JSON.stringify(payload.faultCodes) : null
      }
    });

    // 3. Update Current Status on Equipment model
    if (payload.odometer || payload.engineHours) {
      await prisma.equipment.update({
        where: { id: equipment.id },
        data: {
          lastOdometer: payload.odometer || equipment.lastOdometer,
          lastEngineHours: payload.engineHours || equipment.lastEngineHours
        }
      });
    }

    // 4. (Optional AI Extension) - Analyze Fault Codes for Predictive Maintenance
    if (payload.faultCodes && payload.faultCodes.length > 0) {
      await prisma.equipmentAIValidation.create({
        data: {
          equipmentId: equipment.id,
          type: 'PREDICTIVE_MAINTENANCE',
          severity: 'HIGH',
          findings: `Active Diagnostic Trouble Codes detected: ${payload.faultCodes.join(', ')}`,
          recommendations: 'Immediate diagnostic and preventive maintenance recommended.'
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('FMS Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
