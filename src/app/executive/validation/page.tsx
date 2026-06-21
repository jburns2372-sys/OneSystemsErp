import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { requirePermission } from '@/lib/permissions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'AI Validation Command Center | Executive',
};

async function getValidationDashboardData() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value || '';
  await requirePermission(userId, 'PROJECT_MANAGEMENT', 'canView');

  const scores = await prisma.projectValidationScore.findMany({
    include: {
      project: {
        select: {
          name: true,
          client: true,
          status: true,
          _count: {
            select: {
              projectValidations: {
                where: { status: 'PENDING' }
              }
            }
          }
        }
      }
    },
    orderBy: [
      { riskLevel: 'asc' }, // RED comes first alphabetically? No, we should manually sort.
    ]
  });

  // Sort by risk severity: RED -> ORANGE -> YELLOW -> GREEN -> GRAY
  const riskWeights: Record<string, number> = { 'RED': 4, 'ORANGE': 3, 'YELLOW': 2, 'GREEN': 1, 'GRAY': 0 };
  scores.sort((a, b) => riskWeights[b.riskLevel] - riskWeights[a.riskLevel]);

  return scores;
}

export default async function AIValidationDashboardPage() {
  const cookieStore = await cookies();
  const currentProjectId = cookieStore.get('executive_projectId')?.value || 'ALL';

  if (currentProjectId !== 'ALL') {
    redirect(`/executive/validation/${currentProjectId}`);
  }

  const scores = await getValidationDashboardData();

  const getRiskColors = (level: string) => {
    switch(level) {
      case 'GREEN': return { bg: '#d1fae5', text: '#065f46', border: '#34d399' };
      case 'YELLOW': return { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' };
      case 'ORANGE': return { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' };
      case 'RED': return { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    }
  };

  const highRiskCount = scores.filter(s => s.riskLevel === 'RED' || s.riskLevel === 'ORANGE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, color: '#111827' }}>AI Project Validation Command Center</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280' }}>Executive evidence scoring, AI risk detection, and automated validation routing.</p>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Total Projects Scored</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{scores.length}</div>
        </div>
        <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
          <div style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: 600 }}>High Risk Projects (Red/Orange)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#b91c1c' }}>{highRiskCount}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Pending Evidence Review</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
            {scores.reduce((sum, s) => sum + s.project._count.projectValidations, 0)} items
          </div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Average Portfolio Confidence</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>
            {scores.length > 0 ? (scores.reduce((sum, s) => sum + s.validationConfidenceScore, 0) / scores.length).toFixed(1) : '0'} / 100
          </div>
        </div>
      </div>

      {/* Risk Scoring Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
        {scores.map(score => {
          const colors = getRiskColors(score.riskLevel);
          return (
            <div key={score.id} style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Card Header */}
              <div style={{ backgroundColor: colors.bg, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: colors.text }}>{score.project.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: colors.text, opacity: 0.8, marginTop: '2px' }}>{score.project.client}</div>
                </div>
                <div style={{ 
                  backgroundColor: 'white', 
                  color: colors.text, 
                  fontWeight: 800, 
                  fontSize: '1.25rem',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`
                }}>
                  {score.validationConfidenceScore.toFixed(1)}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Progress Bars */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                    <span style={{ color: '#4b5563' }}>Reported Progress</span>
                    <span style={{ fontWeight: 600 }}>{score.reportedProgress.toFixed(1)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px' }}>
                    <div style={{ width: `${score.reportedProgress}%`, height: '100%', backgroundColor: '#9ca3af', borderRadius: '3px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                    <span style={{ color: '#4b5563', fontWeight: 600 }}>AI Validated Progress</span>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{score.aiValidatedProgress.toFixed(1)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px' }}>
                    <div style={{ width: `${score.aiValidatedProgress}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '3px' }} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#6b7280' }}>Evidence Completeness:</span>
                    <span style={{ fontWeight: 600 }}>{score.evidenceCompletenessScore.toFixed(0)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#6b7280' }}>Latest Validation:</span>
                    <span style={{ fontWeight: 500 }}>{score.latestValidationDate ? score.latestValidationDate.toLocaleDateString() : 'None'}</span>
                  </div>
                </div>

                {/* Action Link */}
                <Link 
                  href={`/executive/validation/${score.projectId}`} 
                  style={{ 
                    display: 'block', 
                    textAlign: 'center', 
                    padding: '10px', 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '6px', 
                    textDecoration: 'none', 
                    color: '#0f172a', 
                    fontWeight: 600,
                    marginTop: '8px'
                  }}
                >
                  View Validation Details
                </Link>

              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}
