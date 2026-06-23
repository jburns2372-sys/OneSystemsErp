'use client';

import React from 'react';
import Link from 'next/link';

export default function SchedulingDashboardClient({ projects }: { projects: any[] }) {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: 'var(--accent-color)', marginBottom: '20px' }}>Project Scheduling Master Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Select a project below to manage its official schedule, WBS, Gantt Chart, and AI Intelligence.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {projects.map(project => (
          <Link key={project.id} href={`/projects/${project.id}/scheduling`} style={{ textDecoration: 'none' }}>
            <div className="glass-panel hover-effect" style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{project.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>{project.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Schedule Status:</span>
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 'bold',
                  color: project.projectSchedule ? 'var(--accent-color)' : '#f59e0b'
                }}>
                  {project.projectSchedule ? project.projectSchedule.status : 'NO SCHEDULE'}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <div style={{ color: 'var(--text-secondary)' }}>No active projects found.</div>
        )}
      </div>
    </div>
  );
}
