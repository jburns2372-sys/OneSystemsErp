'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SchedulingDashboard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/scheduling/dashboard`)
      .then(res => res.json())
      .then(resData => {
        if (resData.error) throw new Error(resData.error);
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Dashboard Analytics...</div>;
  if (error) return <div style={{ padding: '40px', color: '#ef4444' }}>Error: {error}</div>;
  if (!data) return null;

  const { kpis, sCurveData } = data;

  const chartData = {
    labels: sCurveData.map((d: any) => d.date),
    datasets: [
      {
        label: 'Planned Progress (%)',
        data: sCurveData.map((d: any) => d.planned),
        borderColor: 'rgba(0, 240, 255, 0.8)',
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Actual Progress (%)',
        data: sCurveData.map((d: any) => d.actual),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Cumulative %' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    },
    plugins: {
      legend: { position: 'top' as const, labels: { color: 'white' } },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    }
  };

  const getSpiColor = (spi: number) => {
    if (spi >= 1) return '#10b981'; // green
    if (spi >= 0.9) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div style={{ padding: '20px' }}>
      
      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '5px' }}>Overall Progress</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{kpis.overallProgress}%</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', borderLeft: `4px solid ${getSpiColor(kpis.spi)}` }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '5px' }}>Schedule Performance Index (SPI)</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getSpiColor(kpis.spi) }}>{kpis.spi}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {kpis.spi >= 1 ? 'Ahead of Schedule' : 'Behind Schedule'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '5px' }}>Completed Activities</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{kpis.completedActivities} <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>/ {kpis.totalActivities}</span></div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '5px' }}>Delayed Activities</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{kpis.delayedActivities}</div>
        </div>

      </div>

      {/* ── S-Curve Chart ── */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', height: '400px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>Project S-Curve</h3>
        <div style={{ height: '320px' }}>
          <Line options={chartOptions} data={chartData} />
        </div>
      </div>

    </div>
  );
}
