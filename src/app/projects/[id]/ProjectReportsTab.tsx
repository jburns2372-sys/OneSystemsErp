import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileBarChart2, ShieldAlert, Cpu } from 'lucide-react';

export default async function ProjectReportsTab({ projectId }: { projectId: string }) {
  return (
    <div style={{ 
      position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)',
      boxShadow: 'inset 0 0 50px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px', transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
        animation: 'gridMoveWhite 15s linear infinite', opacity: 0.5, zIndex: 0
      }} />
      <style>{`
        @keyframes gridMoveWhite { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } }
        @keyframes float3dWhite { 0%, 100% { transform: translateY(0) rotateX(10deg) rotateY(-5deg); box-shadow: 0 20px 40px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2); } 50% { transform: translateY(-15px) rotateX(15deg) rotateY(0deg); box-shadow: 0 35px 50px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.3); } }
      `}</style>
      <div style={{
        position: 'relative', zIndex: 1, padding: '50px 60px', background: 'rgba(10, 15, 30, 0.6)', backdropFilter: 'blur(16px)',
        borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.15)', borderTop: '1px solid rgba(255, 255, 255, 0.4)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.4)', textAlign: 'center', animation: 'float3dWhite 6s ease-in-out infinite',
        transformStyle: 'preserve-3d', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'
      }}>
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(0,0,0,0.8))',
          border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 0 20px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.2)', transform: 'translateZ(40px)'
        }}>
          <FileBarChart2 size={48} color="#ffffff" strokeWidth={1.5} />
        </div>
        <div style={{ transform: 'translateZ(30px)' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #aaaaaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>
            System Reports
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', maxWidth: '400px', lineHeight: '1.6', margin: 0 }}>
            No AI-generated or custom reports have been exported for this project.
          </p>
        </div>
      </div>
    </div>
  );
}
