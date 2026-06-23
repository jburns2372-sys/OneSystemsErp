import React from 'react';
import { getProjectPortfolio } from '@/app/actions/executiveActions';
import Link from 'next/link';

export const metadata = {
  title: 'Project Portfolio | Command Center',
};

export default async function ExecutivePortfolioPage() {
  const projects = await getProjectPortfolio();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'GREEN': return { bg: '#d1fae5', text: '#065f46' };
      case 'YELLOW': return { bg: '#fef3c7', text: '#92400e' };
      case 'ORANGE': return { bg: '#ffedd5', text: '#9a3412' };
      case 'RED': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, color: '#111827' }}>Project Portfolio</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280' }}>High-level overview of all projects, progress, and AI risk scores.</p>
        </div>
      </div>

      {/* Projects Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Project Name</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Revised Contract</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Billed Progress</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Timeline</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>AI Risk Level</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>AI Score</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, idx) => {
                const riskColors = getRiskColor(project.riskLevel);
                const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA';
                
                return (
                  <tr key={project.id} style={{ borderBottom: idx === projects.length - 1 ? 'none' : '1px solid #e5e7eb', backgroundColor: '#ffffff', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{project.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>{project.client}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: '9999px', backgroundColor: project.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6', color: project.status === 'ACTIVE' ? '#065f46' : '#374151' }}>
                        {project.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: '#374151' }}>
                      {formatCurrency(project.revisedAmount)}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: '#3b82f6', width: `${Math.min(100, project.progressPercentage)}%` }} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', minWidth: '40px' }}>
                          {project.progressPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.8rem', color: '#4b5563', whiteSpace: 'nowrap' }}>
                      <div><strong style={{color: '#111827'}}>Start:</strong> {formatDate(project.startDate)}</div>
                      <div style={{ marginTop: '4px' }}><strong style={{color: '#111827'}}>Target:</strong> {formatDate(project.revisedCompletionDate || project.originalCompletionDate)}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: '9999px', backgroundColor: riskColors.bg, color: riskColors.text }}>
                        {project.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#111827' }}>
                      {project.validationConfidenceScore > 0 ? project.validationConfidenceScore.toFixed(1) : '-'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Link href={`/executive/validation/${project.id}`} style={{ fontSize: '0.875rem', fontWeight: 500, color: '#2563eb', textDecoration: 'none' }}>
                        View AI Data →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
