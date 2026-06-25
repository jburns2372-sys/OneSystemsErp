import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileSignature, PlusCircle, TrendingUp, TrendingDown, Layers, Activity } from 'lucide-react';

export default async function ProjectVariationOrdersTab({ projectId }: { projectId: string }) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  const variationOrders = await prisma.variationOrder.findMany({
    where: { projectId },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });

  const originalContract = project?.contractAmount || 0;

  if (variationOrders.length === 0) {
    return (
      <div style={{ 
        position: 'relative',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: '16px',
        border: '1px solid rgba(0, 240, 255, 0.2)',
        background: 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)',
        boxShadow: 'inset 0 0 50px rgba(0,240,255,0.05), 0 10px 30px rgba(0,0,0,0.5)'
      }}>
        {/* Animated Background Grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
          animation: 'gridMove 15s linear infinite',
          opacity: 0.5,
          zIndex: 0
        }} />
        <style>{`
          @keyframes gridMove {
            0% { background-position: 0 0; }
            100% { background-position: 0 40px; }
          }
          @keyframes float3d {
            0%, 100% { transform: translateY(0) rotateX(10deg) rotateY(-5deg); box-shadow: 0 20px 40px rgba(0,240,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2); }
            50% { transform: translateY(-15px) rotateX(15deg) rotateY(0deg); box-shadow: 0 35px 50px rgba(0,240,255,0.2), inset 0 1px 0 rgba(255,255,255,0.3); }
          }
          @keyframes pulseGlow {
            0%, 100% { filter: drop-shadow(0 0 10px rgba(0,240,255,0.5)); }
            50% { filter: drop-shadow(0 0 25px rgba(0,240,255,0.8)); }
          }
          .tech-button {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
          }
          .tech-button::before {
            content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s ease;
          }
          .tech-button:hover::before { left: 100%; }
          .tech-button:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 0 20px rgba(0, 240, 255, 0.4); }
        `}</style>
        
        {/* Floating 3D Card */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          padding: '50px 60px',
          background: 'rgba(10, 15, 30, 0.6)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid rgba(0, 240, 255, 0.15)',
          borderTop: '1px solid rgba(0, 240, 255, 0.4)',
          borderLeft: '1px solid rgba(0, 240, 255, 0.4)',
          textAlign: 'center',
          animation: 'float3d 6s ease-in-out infinite',
          transformStyle: 'preserve-3d',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* 3D Icon */}
          <div style={{
            width: '100px', height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(0,0,0,0.8))',
            border: '2px solid rgba(0,240,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 0 20px rgba(0,240,255,0.5), 0 0 30px rgba(0,240,255,0.2)',
            animation: 'pulseGlow 3s infinite',
            transform: 'translateZ(40px)'
          }}>
            <FileSignature size={48} color="#00f0ff" strokeWidth={1.5} />
          </div>

          <div style={{ transform: 'translateZ(30px)' }}>
            <h2 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '2rem', 
              fontWeight: '800', 
              background: 'linear-gradient(to right, #ffffff, #00f0ff)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              letterSpacing: '1px'
            }}>
              Variation Orders Control
            </h2>
            <p style={{ 
              color: 'rgba(255,255,255,0.6)', 
              fontSize: '1.1rem', 
              maxWidth: '400px', 
              lineHeight: '1.6', 
              margin: 0 
            }}>
              No change orders, additional works, or BOQ adjustments have been logged for this project yet.
            </p>
          </div>

          <Link 
            href="/variation-orders" 
            className="tech-button"
            style={{
              marginTop: '10px',
              backgroundColor: '#00f0ff',
              color: '#000',
              padding: '14px 32px',
              borderRadius: '12px',
              fontWeight: '900',
              fontSize: '1.1rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transform: 'translateZ(50px)'
            }}
          >
            <PlusCircle size={20} /> Initialize First V.O.
          </Link>
        </div>
      </div>
    );
  }

  // Summary calculations (only approved VOs affect the revised contract)
  const approvedVOs = variationOrders.filter(vo => vo.currentStatus === 'APPROVED');
  const totalAdditive = approvedVOs.reduce((sum, vo) => sum + (vo.additionalAmount || 0), 0);
  const totalDeductive = approvedVOs.reduce((sum, vo) => sum + (vo.deductiveAmount || 0), 0);
  const revisedContract = originalContract + totalAdditive - totalDeductive;
  
  const approvedCount = approvedVOs.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return '#9e9e9e';
      case 'SUBMITTED': return '#2196f3';
      case 'FOR_COSTING': case 'FOR_PM_REVIEW': case 'FOR_FINANCE_REVIEW': case 'FOR_PD_APPROVAL':
        return '#ff9800';
      case 'APPROVED': return '#00f0ff';
      case 'REJECTED': return '#ff5252';
      default: return '#9e9e9e';
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        .card-3d {
          background: rgba(10, 15, 30, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.05);
          border-top: 1px solid rgba(255,255,255,0.15);
          border-left: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 24px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .card-3d:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,240,255,0.05);
        }
        .card-3d::after {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%);
          pointer-events: none;
        }
        .row-hover {
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .row-hover:hover {
          background: rgba(0, 240, 255, 0.05);
          transform: scale(1.01);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          z-index: 10;
          position: relative;
          border-radius: 8px;
        }
        .header-button-blue:hover {
          transform: scale(1.05) !important;
        }
        .glow-text {
          color: #00f0ff;
          text-shadow: 0 0 10px rgba(0,240,255,0.5);
        }
      `}</style>

      {/* Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.6rem', color: '#fff' }}>
          <div style={{ background: 'rgba(0,240,255,0.1)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(0,240,255,0.2)' }}>
            <Layers size={24} color="#00f0ff" />
          </div>
          Variation Orders Tracker
        </h2>
        <Link 
          href="/variation-orders" 
          className="header-button-blue"
          style={{
            background: 'linear-gradient(135deg, #00f0ff, #0088ff)',
            color: '#000',
            padding: '10px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 15px rgba(0,240,255,0.3)',
            transition: 'transform 0.2s'
          }}
        >
          <PlusCircle size={18} /> New Variation Order
        </Link>
      </div>

      {/* 3D Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="card-3d">
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSignature size={16} /> Original Contract
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff' }}>₱ {originalContract.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: '0.8rem', color: '#00f0ff', marginTop: '12px', background: 'rgba(0,240,255,0.1)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
            {variationOrders.length} Total VOs
          </div>
        </div>
        
        <div className="card-3d" style={{ borderBottom: '2px solid #00e676' }}>
          <div style={{ fontSize: '0.85rem', color: '#00e676', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} /> Total Additive
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#00e676', textShadow: '0 0 10px rgba(0,230,118,0.3)' }}>
            + ₱ {totalAdditive.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '12px' }}>Approved Additions</div>
        </div>
        
        <div className="card-3d" style={{ borderBottom: '2px solid #ff5252' }}>
          <div style={{ fontSize: '0.85rem', color: '#ff5252', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingDown size={16} /> Total Deductive
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ff5252', textShadow: '0 0 10px rgba(255,82,82,0.3)' }}>
            - ₱ {totalDeductive.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '12px' }}>Approved Deductions</div>
        </div>
        
        <div className="card-3d" style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.1), rgba(0,136,255,0.1))', border: '1px solid rgba(0,240,255,0.4)', boxShadow: '0 0 20px rgba(0,240,255,0.1)' }}>
          <div style={{ fontSize: '0.85rem', color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} /> Revised Contract
          </div>
          <div className="glow-text" style={{ fontSize: '1.8rem', fontWeight: '900' }}>
            ₱ {revisedContract.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginTop: '12px' }}>Net Impact Applied</div>
        </div>
      </div>

      {/* 3D List View */}
      <div style={{ 
        background: 'rgba(10, 15, 30, 0.8)', 
        backdropFilter: 'blur(20px)',
        borderRadius: '16px', 
        border: '1px solid rgba(255,255,255,0.1)', 
        padding: '8px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', fontSize: '0.95rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '16px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>VO Tracking ID</th>
              <th style={{ padding: '16px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Classification</th>
              <th style={{ padding: '16px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Justification</th>
              <th style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Line Items</th>
              <th style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'right', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {variationOrders.map((vo: any) => (
              <tr key={vo.id} className="row-hover" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '16px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                  <Link href={`/variation-orders/${vo.id}`} style={{ 
                    color: '#00f0ff', 
                    textDecoration: 'none', 
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {vo.voNumber}
                  </Link>
                </td>
                <td style={{ padding: '16px', color: 'rgba(255,255,255,0.8)' }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                    {vo.variationType.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {vo.reasonForVariation}
                </td>
                <td style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}>{vo.items.length}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    letterSpacing: '0.5px',
                    backgroundColor: `${getStatusColor(vo.currentStatus)}15`,
                    color: getStatusColor(vo.currentStatus),
                    border: `1px solid ${getStatusColor(vo.currentStatus)}40`,
                    boxShadow: `0 0 10px ${getStatusColor(vo.currentStatus)}20`
                  }}>
                    {vo.currentStatus.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ 
                  padding: '16px', 
                  textAlign: 'right', 
                  fontWeight: '900', 
                  color: (vo.netVariationAmount || 0) >= 0 ? '#00e676' : '#ff5252',
                  borderTopRightRadius: '8px', 
                  borderBottomRightRadius: '8px' 
                }}>
                  {(vo.netVariationAmount || 0) >= 0 ? '+' : ''} ₱ {(vo.netVariationAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
