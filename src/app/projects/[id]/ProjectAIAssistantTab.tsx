import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Cpu, Sparkles, MessageSquare } from 'lucide-react';

export default async function ProjectAIAssistantTab({ projectId }: { projectId: string }) {
  return (
    <div style={{ 
      position: 'relative', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.2)',
      background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)',
      boxShadow: 'inset 0 0 50px rgba(139,92,246,0.05), 0 10px 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px', transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
        animation: 'gridMoveViolet 15s linear infinite', opacity: 0.5, zIndex: 0
      }} />
      <style>{`
        @keyframes gridMoveViolet { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } }
        @keyframes float3dViolet { 0%, 100% { transform: translateY(0) rotateX(10deg) rotateY(-5deg); box-shadow: 0 20px 40px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.2); } 50% { transform: translateY(-15px) rotateX(15deg) rotateY(0deg); box-shadow: 0 35px 50px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.3); } }
        @keyframes pulseGlowViolet { 0%, 100% { filter: drop-shadow(0 0 10px rgba(139,92,246,0.5)); } 50% { filter: drop-shadow(0 0 25px rgba(139,92,246,0.8)); } }
        .tech-button-violet { position: relative; overflow: hidden; transition: all 0.3s ease; }
        .tech-button-violet::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s ease; }
        .tech-button-violet:hover::before { left: 100%; }
        .tech-button-violet:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 0 20px rgba(139, 92, 246, 0.4); }
      `}</style>
      <div style={{
        position: 'relative', zIndex: 1, padding: '50px 60px', background: 'rgba(10, 15, 30, 0.6)', backdropFilter: 'blur(16px)',
        borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', borderTop: '1px solid rgba(139, 92, 246, 0.4)',
        borderLeft: '1px solid rgba(139, 92, 246, 0.4)', textAlign: 'center', animation: 'float3dViolet 6s ease-in-out infinite',
        transformStyle: 'preserve-3d', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'
      }}>
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(0,0,0,0.8))',
          border: '2px solid rgba(139,92,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 0 20px rgba(139,92,246,0.5), 0 0 30px rgba(139,92,246,0.2)', animation: 'pulseGlowViolet 3s infinite', transform: 'translateZ(40px)'
        }}>
          <Cpu size={48} color="#8b5cf6" strokeWidth={1.5} />
        </div>
        <div style={{ transform: 'translateZ(30px)' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>
            AI Executive Assistant
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', maxWidth: '400px', lineHeight: '1.6', margin: 0 }}>
            Project-specific context loaded. You can query financial variances, predict scheduling delays, or ask for document analysis.
          </p>
        </div>
        <Link href={`/knowledge-center?projectId=${projectId}`} className="tech-button-violet" style={{
            marginTop: '10px', backgroundColor: '#8b5cf6', color: '#fff', padding: '14px 32px', borderRadius: '12px', fontWeight: '900',
            fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase',
            letterSpacing: '1px', transform: 'translateZ(50px)'
          }}>
          <MessageSquare size={20} /> Open AI Chat
        </Link>
      </div>
    </div>
  );
}
