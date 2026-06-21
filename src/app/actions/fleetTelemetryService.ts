'use server';

import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { cookies } from 'next/headers';

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('session')?.value || '';
}

export async function getLiveFleetLocations() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');

  // Get all active Hikvision devices and their latest GPS
  const devices = await prisma.hikvisionDevice.findMany({
    where: { status: 'ACTIVE' },
    include: {
      equipment: {
        include: {
          telemetry: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      }
    }
  });

  return devices.map(d => {
    const latestGps = d.equipment?.telemetry[0] || null;
    return {
      deviceId: d.id,
      deviceName: d.deviceName,
      equipmentCode: d.equipment?.code || 'N/A',
      equipmentName: d.equipment?.name || 'N/A',
      plateNumber: d.equipment?.plateNumber || 'N/A',
      lastSeenAt: d.lastSeenAt,
      integrationType: d.integrationType,
      telemetry: latestGps ? {
        latitude: latestGps.latitude,
        longitude: latestGps.longitude,
        speed: latestGps.speed,
        heading: latestGps.heading,
        engineState: latestGps.engineState,
        timestamp: latestGps.timestamp
      } : null
    };
  });
}
