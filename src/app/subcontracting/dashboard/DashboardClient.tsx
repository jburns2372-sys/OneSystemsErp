'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SubcontractListClient from './SubcontractListClient';
import JobOrderListClient from '@/app/job-orders/dashboard/JobOrderListClient';

import { useRouter } from 'next/navigation';

export default function DashboardClient({ subModules, joModules, packages, jobOrders }: { subModules: any[], joModules: any[], packages: any[], jobOrders: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'SUBCONTRACTING' | 'JOB_ORDERS'>('SUBCONTRACTING');

  const currentModules = activeTab === 'SUBCONTRACTING' ? subModules : joModules;

  return (
    <>
      <style>{`
        .module-card {
          background-color: var(--bg-secondary, #ffffff);
          border-radius: 12px;
          padding: 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: 1px solid var(--glass-border, #e5e7eb);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          cursor: pointer;
        }
        .module-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px rgba(0,0,0,0.1);
          border-color: var(--accent-color, #3b82f6);
        }
        .tab-btn {
          flex: 1;
          padding: 24px;
          border-radius: 12px;
          border: 2px solid transparent;
          background-color: var(--bg-secondary, #ffffff);
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--text-primary, #111827);
        }
        .tab-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 12px rgba(0,0,0,0.1);
        }
        .tab-btn.active {
          border-color: var(--accent-color, #3b82f6);
          background-color: #eff6ff;
          color: #1d4ed8;
        }
      `}</style>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <button 
          className={`tab-btn ${activeTab === 'SUBCONTRACTING' ? 'active' : ''}`}
          onClick={() => setActiveTab('SUBCONTRACTING')}
        >
          <span style={{ fontSize: '2rem' }}>👷</span>
          Subcontracting Modules
        </button>
        <button 
          className={`tab-btn`}
          onClick={() => router.push('/job-orders/dashboard')}
        >
          <span style={{ fontSize: '2rem' }}>⚡</span>
          Job Order Modules
        </button>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {activeTab === 'SUBCONTRACTING' ? 'Subcontracting Modules' : 'Job Order Modules'}
      </h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        {currentModules.map((module) => (
          <Link 
            key={module.name} 
            href={module.href}
            style={{ textDecoration: 'none' }}
          >
            <div className="module-card">
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
                {module.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary, #111827)', margin: 0 }}>
                {module.name}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #6b7280)', margin: 0, lineHeight: 1.4 }}>
                {module.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Master List Section */}
      <div style={{ marginTop: '40px' }}>
        {activeTab === 'SUBCONTRACTING' ? (
          <SubcontractListClient packages={packages} />
        ) : (
          <JobOrderListClient jobOrders={jobOrders} />
        )}
      </div>
    </>
  );
}
