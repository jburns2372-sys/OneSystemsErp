import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BrainCircuit, PlayCircle, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TrainingModulePage() {
  const trainingRecords = await prisma.knowledgeRecord.findMany({
    where: { documentType: 'TRAINING' },
    orderBy: { dateCreated: 'desc' }
  });

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <BrainCircuit size={40} color="#eab308" />
            AI Training Data & Modules
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>
            Manage context windows, training sets, and instructional modules for the AI model.
          </p>
        </div>
        <button style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #eab308, #f59e0b)', color: '#000', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlayCircle size={20} /> Upload Training Data
        </button>
      </header>

      {trainingRecords.length === 0 ? (
        <div style={{ 
          position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(234, 179, 8, 0.2)',
          background: 'radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)',
          boxShadow: 'inset 0 0 50px rgba(234, 179, 8, 0.05), 0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(234, 179, 8, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(234, 179, 8, 0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px', transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
            animation: 'gridMoveYellow 15s linear infinite', opacity: 0.5, zIndex: 0
          }} />
          <style>{`
            @keyframes gridMoveYellow { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } }
            @keyframes float3dYellow { 0%, 100% { transform: translateY(0) rotateX(10deg) rotateY(-5deg); box-shadow: 0 20px 40px rgba(234, 179, 8, 0.1), inset 0 1px 0 rgba(255,255,255,0.2); } 50% { transform: translateY(-15px) rotateX(15deg) rotateY(0deg); box-shadow: 0 35px 50px rgba(234, 179, 8, 0.2), inset 0 1px 0 rgba(255,255,255,0.3); } }
            @keyframes pulseGlowYellow { 0%, 100% { filter: drop-shadow(0 0 10px rgba(234, 179, 8, 0.5)); } 50% { filter: drop-shadow(0 0 25px rgba(234, 179, 8, 0.8)); } }
          `}</style>
          <div style={{
            position: 'relative', zIndex: 1, padding: '50px 60px', background: 'rgba(10, 15, 30, 0.6)', backdropFilter: 'blur(16px)',
            borderRadius: '24px', border: '1px solid rgba(234, 179, 8, 0.15)', borderTop: '1px solid rgba(234, 179, 8, 0.4)',
            borderLeft: '1px solid rgba(234, 179, 8, 0.4)', textAlign: 'center', animation: 'float3dYellow 6s ease-in-out infinite',
            transformStyle: 'preserve-3d', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'
          }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(0,0,0,0.8))',
              border: '2px solid rgba(234, 179, 8, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 0 20px rgba(234, 179, 8, 0.5), 0 0 30px rgba(234, 179, 8, 0.2)', animation: 'pulseGlowYellow 3s infinite', transform: 'translateZ(40px)'
            }}>
              <BrainCircuit size={48} color="#eab308" strokeWidth={1.5} />
            </div>
            <div style={{ transform: 'translateZ(30px)' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #eab308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>
                AI Model Training
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', maxWidth: '400px', lineHeight: '1.6', margin: 0 }}>
                No active training models or datasets are currently loaded into the Knowledge Center.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '20px' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '15px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>Title</th>
                  <th style={{ textAlign: 'left', padding: '15px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>Module</th>
                  <th style={{ textAlign: 'left', padding: '15px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {trainingRecords.map(record => (
                  <tr key={record.id}>
                    <td style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{record.title}</td>
                    <td style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{record.relatedModule || 'Global'}</td>
                    <td style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{record.status}</td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
}
