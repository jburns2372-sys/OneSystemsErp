import { cookies } from 'next/headers';
import { checkSocAccess, getSocDashboardStats, getLiveThreatFeed, getThreatMapData, getCountermeasuresData } from '@/app/actions/socActions';
import SocDashboardClient from './components/SocDashboardClient';
import { logSecurityEvent } from '@/lib/securityEngine';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Security Operations Center | OneSystemsERP',
};

export default async function SecurityDashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value;

  if (!userId) {
    redirect('/login');
  }

  const hasAccess = await checkSocAccess(userId);

  if (!hasAccess) {
    await logSecurityEvent({
      userId,
      module: 'SYSTEM_SETTINGS',
      action: 'view',
      requestPath: '/admin/security',
      status: 'BLOCKED',
      threatType: 'UNAUTHORIZED_MODULE_ACCESS',
      severity: 'HIGH',
      message: 'Unauthorized access attempt to Security Operations Center dashboard.',
    });
    return (
      <div className="p-10 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-gray-400">You do not have permission to view the Security Operations Center.</p>
        <p className="text-gray-500 text-sm mt-4">This security event has been logged.</p>
      </div>
    );
  }

  const [stats, initialFeed, initialMapData, countermeasures] = await Promise.all([
    getSocDashboardStats(),
    getLiveThreatFeed(),
    getThreatMapData(),
    getCountermeasuresData()
  ]);

  return (
    <SocDashboardClient 
      initialStats={stats} 
      initialFeed={initialFeed} 
      initialMapData={initialMapData}
      initialCountermeasures={countermeasures}
    />
  );
}
