const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const eq = await prisma.equipment.create({
    data: {
      code: 'FLEET-HIK-01',
      name: 'Dump Truck Volvo FMX',
      category: 'VEHICLE',
      plateNumber: 'ABC-1234',
    }
  });

  await prisma.hikvisionDevice.create({
    data: {
      deviceName: 'Volvo Main Dashcam',
      deviceSerialNumber: 'DS-M5504HNI-123456789',
      integrationType: 'DEVICE_GATEWAY',
      equipmentId: eq.id
    }
  });

  console.log('Test device seeded.');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
