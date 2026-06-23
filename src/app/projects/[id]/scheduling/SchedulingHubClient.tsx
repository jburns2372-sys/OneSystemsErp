'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProjectSchedule } from '@/app/actions/schedulingActions';
import ScheduleSetupWizard from './wizard/ScheduleSetupWizard';
import WBSActivityList from './wbs/WBSActivityList';
import GanttChartView from './gantt/GanttChartView';
import SchedulingDashboard from './dashboard/SchedulingDashboard';
import DelayAndRecoveryTab from './delays/DelayAndRecoveryTab';
import PERTNetworkDiagram from './pert/PERTNetworkDiagram';
import AIScheduleIntelligence from './ai/AIScheduleIntelligence';

export default function SchedulingHubClient({ 
  project, 
  initialSchedule, 
  awardedBoq 
}: { 
  project: any; 
  initialSchedule: any; 
  awardedBoq: any;
}) {
  const router = useRouter();
  const [schedule, setSchedule] = useState(initialSchedule);
  const [activeTab, setActiveTab] = useState('GANTT');
  const [isDeleting, startTransition] = useTransition();

  const handleDeleteSchedule = () => {
    if (confirm('Are you sure you want to delete this schedule? This will permanently remove all WBS nodes, activities, dependencies, and BOQ mappings.')) {
      startTransition(async () => {
        try {
          await deleteProjectSchedule(project.id);
          setSchedule(null);
          router.refresh();
        } catch (err: any) {
          alert(err.message || 'Error deleting schedule');
        }
      });
    }
  };

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  if (!schedule) {
    return (
      <ScheduleSetupWizard 
        project={project} 
        awardedBoq={awardedBoq} 
        onScheduleCreated={(newSchedule: any) => {
          setSchedule(newSchedule);
          router.refresh();
        }} 
      />
    );
  }

  const tabs = [
    { key: 'GANTT', label: '📊 Gantt Chart', icon: '' },
    { key: 'WBS', label: '📋 WBS & Activities', icon: '' },
    { key: 'DASHBOARD', label: '📈 Dashboard', icon: '' },
    { key: 'DELAYS', label: '⚠️ Delays & Recovery', icon: '' },
    { key: 'PERT', label: '🔀 PERT/CPM', icon: '' },
    { key: 'AI', label: '🤖 AI Intelligence', icon: '' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'GANTT':
        return (
          <GanttChartView
            projectId={project.id}
            activities={schedule.activities || []}
            dependencies={schedule.dependencies || []}
            projectStartDate={schedule.currentStartDate || schedule.baselineStartDate || project.startDate || new Date().toISOString()}
            projectFinishDate={schedule.currentFinishDate || null}
            scheduleStatus={schedule.status}
            onRefresh={handleRefresh}
          />
        );
      case 'WBS':
        return (
          <WBSActivityList
            projectId={project.id}
            schedule={schedule}
            onRefresh={handleRefresh}
          />
        );
      case 'DASHBOARD':
        return <SchedulingDashboard projectId={project.id} />;
      case 'DELAYS':
        return <DelayAndRecoveryTab projectId={project.id} activities={schedule.activities || []} />;
      case 'PERT':
        return <PERTNetworkDiagram schedule={schedule} />;
      case 'AI':
        return <AIScheduleIntelligence projectId={project.id} />;
      default:
        return null;
    }
  };

  // Summary stats
  const totalActivities = schedule.activities?.length || 0;
  const criticalCount = schedule.activities?.filter((a: any) => a.criticalPath)?.length || 0;
  const completedCount = schedule.activities?.filter((a: any) => a.status === 'COMPLETED')?.length || 0;
  const avgProgress = totalActivities > 0 
    ? Math.round(schedule.activities.reduce((sum: number, a: any) => sum + (a.actualProgressPercent || 0), 0) / totalActivities) 
    : 0;

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: 'var(--accent-color)', margin: '0 0 4px 0', fontSize: '1.5rem' }}>📅 Project Scheduling: {project.name}</h1>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Schedule: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{schedule.name}</span></span>
            <span style={{ color: 'var(--text-secondary)' }}>Status: <span style={{ 
              color: schedule.status === 'BASELINE' ? '#10b981' : schedule.status === 'DRAFT' ? '#f59e0b' : 'var(--accent-color)', 
              fontWeight: 'bold' 
            }}>{schedule.status}</span></span>
            
            {schedule.status !== 'BASELINE' && (
              <button
                onClick={handleDeleteSchedule}
                disabled={isDeleting}
                style={{
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isDeleting ? 'Deleting...' : '🗑️ Delete Schedule'}
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { label: 'Activities', value: totalActivities, color: 'var(--accent-color)' },
            { label: 'Critical', value: criticalCount, color: '#ef4444' },
            { label: 'Done', value: completedCount, color: '#10b981' },
            { label: 'Avg Progress', value: `${avgProgress}%`, color: '#3b82f6' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(0,0,0,0.2)',
              textAlign: 'center',
              minWidth: '70px'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '15px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === tab.key ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent-color)' : 'var(--text-secondary)',
              border: activeTab === tab.key ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid transparent',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              fontSize: '0.85rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass-panel" style={{ borderRadius: '0 8px 8px 8px', minHeight: '500px' }}>
        {renderTabContent()}
      </div>
    </div>
  );
}
