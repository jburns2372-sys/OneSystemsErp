import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ShieldCheck, Lock, Users, Fingerprint } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RBACModulePage() {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: true,
      _count: { select: { userRoles: true } }
    },
    orderBy: { roleName: 'asc' }
  });

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <ShieldCheck size={40} color="#a855f7" />
            Access Control & PBAC
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '5px', maxWidth: '800px' }}>
            Organizational Role-Based Access Control mapped alongside strict Project-Based constraints.
          </p>
        </div>
      </header>

      {/* PBAC Constraint Highlight Card */}
      <div style={{ 
        position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.3)',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%)',
        padding: '30px', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '20px', borderRadius: '50%', boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}>
            <Fingerprint size={48} color="#a855f7" />
          </div>
          <div>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', color: '#fff', textShadow: '0 2px 10px rgba(168, 85, 247, 0.5)' }}>
              Project-Based Access Control (PBAC) Active
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
              All database queries and UI components are intercepting active sessions. 
              <strong> Users are strictly isolated to data linked to their assigned projects.</strong> <br/>
              Even if a user holds an "Executive" role, if they are not mapped to Project X, they cannot view its financial ledgers, job orders, or AI insights.
            </p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Users size={24} color="#a855f7" /> Defined System Roles
      </h2>

      <style>{`
        .role-card-violet {
          background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid var(--glass-border); padding: 24px;
          transition: transform 0.2s, box-shadow 0.2s; cursor: default; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }
        .role-card-violet:hover {
          transform: translateY(-5px); box-shadow: 0 10px 25px rgba(168, 85, 247, 0.2);
        }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {roles.map(role => (
          <div key={role.id} className="role-card-violet">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', color: '#fff' }}>{role.roleName}</h3>
                <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {role.roleCode}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {role._count.userRoles} Users
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', minHeight: '45px', marginBottom: '20px' }}>
              {role.description || 'Standard access permissions apply to this role.'}
            </p>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Accessible Modules
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {role.rolePermissions.length > 0 ? (
                  role.rolePermissions.map(perm => (
                    <span key={perm.id} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#ccc', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      <Lock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {perm.moduleName}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Global Access / System Admin</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {roles.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px dashed rgba(168, 85, 247, 0.3)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No organizational roles have been configured in the database yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
