import { verifySession } from '@/lib/dal/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const userId = __session?.id || '';
  const simulatedRole = cookieStore.get('simulatedRole')?.value || '';
  
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const permissions = await getUserPermissions(userId);

  return NextResponse.json({
    userId,
    userRole: user?.role,
    simulatedRole,
    permissions_IS_ADMIN: permissions.IS_ADMIN,
    permissions_PROCUREMENT_canCreate: permissions.PROCUREMENT?.canCreate,
    permissions_PROCUREMENT_canView: permissions.PROCUREMENT?.canView,
    fullPermissions: permissions
  });
}
