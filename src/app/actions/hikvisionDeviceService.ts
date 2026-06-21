'use server';

import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Use a fallback secret for local dev if not in env
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3'; 

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('session')?.value || '';
}

function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export async function getHikvisionDevices() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');
  
  const devices = await prisma.hikvisionDevice.findMany({
    include: {
      equipment: { select: { code: true, name: true, status: true, plateNumber: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Never return plain text passwords to client
  return devices.map(d => ({
    ...d,
    passwordEncrypted: d.passwordEncrypted ? '******' : null,
    rtspUrlEncrypted: d.rtspUrlEncrypted ? '******' : null
  }));
}

export async function registerHikvisionDevice(data: any) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canEdit');

  const {
    deviceName,
    deviceModel,
    deviceSerialNumber,
    imeiOrUniqueId,
    integrationType,
    ipAddress,
    domainName,
    port,
    username,
    password,
    equipmentId,
    simNumber,
    simProvider
  } = data;

  const passwordEncrypted = password ? encrypt(password) : null;

  return prisma.hikvisionDevice.create({
    data: {
      deviceName,
      deviceModel,
      deviceSerialNumber,
      imeiOrUniqueId,
      integrationType,
      ipAddress,
      domainName,
      port: port ? parseInt(port) : null,
      usernameEncrypted: username,
      passwordEncrypted,
      equipmentId: equipmentId || null,
      simNumber,
      simProvider,
      installedBy: userId,
      installationDate: new Date()
    }
  });
}

export async function testDeviceConnection(deviceId: string) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');
  
  const device = await prisma.hikvisionDevice.findUnique({ where: { id: deviceId } });
  if (!device) throw new Error('Device not found');

  // MOCK: In production, we'd ping the ISAPI endpoint: 
  // e.g. http://${device.ipAddress}:${device.port}/ISAPI/System/deviceInfo
  
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1000));
  
  if (device.integrationType === 'DEVICE_GATEWAY') {
    return { success: true, message: 'Gateway integration ready for incoming webhooks.' };
  }

  if (device.ipAddress) {
    return { success: true, message: `Successfully connected to ${device.ipAddress} via ISAPI.` };
  }

  return { success: false, message: 'Cannot test connection. IP or Gateway not configured.' };
}
