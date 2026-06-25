import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Landmark, ArrowRightCircle, CircleDollarSign, CheckCircle } from 'lucide-react';

export default async function ProjectBillingTab({ projectId }: { projectId: string }) {
  const billings = await prisma.billing.findMany({
    where: { projectId },
    orderBy: { billingDate: 'desc' }
  });

  if (billings.length === 0) {
    return (
      <div style={{ 
        position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)',
        background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)',
        boxShadow: 'inset 0 0 50px rgba(59,130,246,0.05), 0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px', transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
          animation: 'gridMoveBlue 15s linear infinite', opacity: 0.5, zIndex: 0
        }} />
        <style>{`
          @keyframes gridMoveBlue { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } }
          @keyframes float3dBlue { 0%, 100% { transform: translateY(0) rotateX(10deg) rotateY(-5deg); box-shadow: 0 20px 40px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.2); } 50% { transform: translateY(-15px) rotateX(15deg) rotateY(0deg); box-shadow: 0 35px 50px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.3); } }
          @keyframes pulseGlowBlue { 0%, 100% { filter: drop-shadow(0 0 10px rgba(59,130,246,0.5)); } 50% { filter: drop-shadow(0 0 25px rgba(59,130,246,0.8)); } }
          .tech-button-blue { position: relative; overflow: hidden; transition: all 0.3s ease; }
          .tech-button-blue::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s ease; }
          .tech-button-blue:hover::before { left: 100%; }
          .tech-button-blue:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
        `}</style>
        <div style={{
          position: 'relative', zIndex: 1, padding: '50px 60px', background: 'rgba(10, 15, 30, 0.6)', backdropFilter: 'blur(16px)',
          borderRadius: '24px', border: '1px solid rgba(59, 130, 246, 0.15)', borderTop: '1px solid rgba(59, 130, 246, 0.4)',
          borderLeft: '1px solid rgba(59, 130, 246, 0.4)', textAlign: 'center', animation: 'float3dBlue 6s ease-in-out infinite',
          transformStyle: 'preserve-3d', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'
        }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(0,0,0,0.8))',
            border: '2px solid rgba(59,130,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 0 20px rgba(59,130,246,0.5), 0 0 30px rgba(59,130,246,0.2)', animation: 'pulseGlowBlue 3s infinite', transform: 'translateZ(40px)'
          }}>
            <Landmark size={48} color="#3b82f6" strokeWidth={1.5} />
          </div>
          <div style={{ transform: 'translateZ(30px)' }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>
              Billing & Collection
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', maxWidth: '400px', lineHeight: '1.6', margin: 0 }}>
              No project billings or payment collections have been processed yet.
            </p>
          </div>
          <Link href="/finance/billing" className="tech-button-blue" style={{
              marginTop: '10px', backgroundColor: '#3b82f6', color: '#fff', padding: '14px 32px', borderRadius: '12px', fontWeight: '900',
              fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase',
              letterSpacing: '1px', transform: 'translateZ(50px)'
            }}>
            <CircleDollarSign size={20} /> Create Billing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        .header-button-blue:hover { transform: scale(1.05) !important; }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.6rem', color: '#fff' }}>
          <div style={{ background: 'rgba(59,130,246,0.1)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Landmark size={24} color="#3b82f6" />
          </div>
          Billing & Collection
        </h2>
        <Link href="/finance/billing" className="header-button-blue" style={{
            background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(59,130,246,0.3)', transition: 'transform 0.2s'
          }}>
          <ArrowRightCircle size={18} /> Manage Billings
        </Link>
      </div>
    </div>
  );
}
