import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { verifySession } from '@/lib/dal/auth';
import { getUserPermissions } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import styles from '../../page.module.css';

type RetentionPackage = Prisma.SubcontractPackageGetPayload<{
  include: {
    subcontractor: {
      select: { name: true };
    };
    billings: {
      select: {
        retentionDeduction: true;
        status: true;
      };
    };
  };
}>;

// Global project scope is granted only by the database-backed account role
// (never by a client-controlled cookie such as `activeProjectId` or `simulatedRole`).
// Mirrors ADMIN_GLOBAL_ROLES enforced by the Express backend auth middleware.
const GLOBAL_PROJECT_SCOPE_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN']);

function AccessDenied() {
  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1400px', textAlign: 'center', padding: '100px 20px' }}>
      <h2>Access Denied</h2>
      <p>You do not have access to Retention Payables for the selected project.</p>
    </div>
  );
}

export default async function RetentionPage() {
  // 1. Database-backed session verification (status, lock, sessionVersion).
  const session = await verifySession();
  if (!session?.id) {
    redirect('/login');
  }

  // 2. Module permission: Subcontracting view access is required.
  const permissions = await getUserPermissions(session.id);
  const canViewSubcontracting =
    permissions.IS_ADMIN === true || permissions.SUBCONTRACTING?.canView === true;
  if (!canViewSubcontracting) {
    return <AccessDenied />;
  }

  const hasGlobalProjectScope = GLOBAL_PROJECT_SCOPE_ROLES.has(session.role);

  // 3. The cookie is only a *requested* project; it is never proof of authorization.
  const cookieStore = await cookies();
  const requestedProjectId = cookieStore.get('activeProjectId')?.value?.trim() || undefined;
  const scopedRequestedProjectId =
    requestedProjectId && requestedProjectId.toUpperCase() !== 'ALL' ? requestedProjectId : undefined;

  if (!scopedRequestedProjectId && !hasGlobalProjectScope) {
    return (
      <div className={styles.dashboardContainer} style={{ maxWidth: '1400px', textAlign: 'center', padding: '100px 20px' }}>
        <h2>No Active Project Selected</h2>
        <p>Please select an Active Project from the top navigation bar to view Retention Payables.</p>
      </div>
    );
  }

  // 4. Verify active project assignment before any project-specific query.
  let authorizedProjectId: string | undefined;
  if (scopedRequestedProjectId) {
    if (hasGlobalProjectScope) {
      authorizedProjectId = scopedRequestedProjectId;
    } else {
      const assignment = await prisma.projectUserAssignment.findFirst({
        where: {
          userId: session.id,
          projectId: scopedRequestedProjectId,
          assignmentStatus: 'active',
        },
        select: { projectId: true },
      });
      if (!assignment) {
        return <AccessDenied />;
      }
      authorizedProjectId = assignment.projectId;
    }
  }

  // Fetch subcontract packages that have a retention percentage
  let packages: RetentionPackage[] = [];
  try {
    packages = await prisma.subcontractPackage.findMany({
      where: { 
        // undefined only for verified global-scope roles without a selected project
        projectId: authorizedProjectId,
        retentionPct: { gt: 0 }
      },
      include: {
        subcontractor: {
          select: { name: true }
        },
        billings: {
          select: {
            retentionDeduction: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to fetch packages for retention:', error);
  }

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1400px' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Retention Payables Hub</h1>
          <p>Track accumulated retention amounts and release schedules for subcontractors.</p>
        </div>
      </header>

      <div style={{ padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>Accumulated Retention by Package</h3>
        
        {packages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No active subcontracts with retention found for this project.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Package No.</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Subcontractor</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Scope</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Contract Amt</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Retention Rate</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Accumulated Retention</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => {
                  const accumulatedRetention = pkg.billings
                    ?.filter((b) => b.status === 'APPROVED_FOR_PAYMENT' || b.status === 'PAID')
                    .reduce((sum: number, b) => sum + (b.retentionDeduction || 0), 0) || 0;

                  return (
                    <tr key={pkg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{pkg.packageNumber}</td>
                      <td style={{ padding: '12px' }}>{pkg.subcontractor?.name || 'Unknown'}</td>
                      <td style={{ padding: '12px' }}>{pkg.scopeOfWork}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>₱{(pkg.contractAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{pkg.retentionPct}%</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                        ₱{accumulatedRetention.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button style={{ padding: '6px 12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          Process Release
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
