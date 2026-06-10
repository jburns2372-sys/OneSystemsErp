'use client';

import { useState } from 'react';
import LockConsolidatedBOQButton from './LockConsolidatedBOQButton';
import GenerateMRFModal from './GenerateMRFModal';

interface ConsolidatedBOQViewerProps {
  projectId: string;
  isLocked: boolean;
  consolidatedItems: any[];
  totalItems: number;
  totalAmount: number;
  users?: { id: string; name: string | null }[];
}

export default function ConsolidatedBOQViewer({ 
  projectId, 
  isLocked, 
  consolidatedItems, 
  totalItems, 
  totalAmount,
  users = []
}: ConsolidatedBOQViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

  function toggleSelection(id: string) {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItemIds(newSet);
  }

  function handleSelectAll() {
    if (selectedItemIds.size === consolidatedItems.length) {
      setSelectedItemIds(newSet => new Set());
    } else {
      setSelectedItemIds(new Set(consolidatedItems.map(i => i.id)));
    }
  }

  const selectedItemsList = consolidatedItems.filter(item => selectedItemIds.has(item.id));

  return (
    <div className={isFullscreen ? "fullscreen-wrapper" : "normal-wrapper"}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h2 style={{ color: isFullscreen ? '#fff' : 'var(--text-primary)', margin: 0 }}>Consolidated Master List Overview</h2>
          <p style={{ margin: '8px 0 0 0', color: isFullscreen ? '#aaa' : 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {totalItems} grouped items &bull; Total Value: ₱ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isLocked && selectedItemIds.size > 0 && (
            <button 
              onClick={() => setIsModalOpen(true)}
              style={{
                backgroundColor: 'var(--accent-color)',
                color: '#000', border: 'none', padding: '8px 16px',
                borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '0 0 10px var(--accent-glow)'
              }}
            >
              📋 Generate MRF ({selectedItemIds.size})
            </button>
          )}
          <LockConsolidatedBOQButton projectId={projectId} isLocked={isLocked} />
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-secondary"
            style={{ 
              backgroundColor: isFullscreen ? 'var(--accent-color)' : 'transparent', 
              color: isFullscreen ? '#000' : 'var(--accent-color)',
              borderColor: 'var(--accent-color)',
              fontWeight: 'bold',
              zIndex: 10000
            }}
          >
            {isFullscreen ? 'Exit Full Screen' : '⛶ Maximize'}
          </button>
        </div>
      </div>

      {isModalOpen && (
        <GenerateMRFModal 
          projectId={projectId}
          items={selectedItemsList}
          users={users}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <div className="table-scroll-container" style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
        <style dangerouslySetInnerHTML={{__html: `
          .fullscreen-wrapper {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: var(--bg-dark);
            z-index: 9999999;
            padding: 20px;
            display: flex;
            flex-direction: column;
          }
          .normal-wrapper {
            position: relative;
          }
          .table-scroll-container {
            overflow: auto;
            flex-grow: 1;
            max-height: ${isFullscreen ? 'calc(100vh - 120px)' : '600px'};
          }
          .consolidation-table { 
            width: 100%; 
            border-collapse: separate; 
            border-spacing: 0;
            color: #000; 
            font-size: 0.85rem; 
          }
          .consolidation-table td, .consolidation-table th { 
            padding: 10px; 
            background-color: #fff;
          }
          .consolidation-table th {
            background-color: #f0f0f0 !important;
            position: sticky;
            top: 0;
            z-index: 10;
            border-bottom: 2px solid #ccc;
            text-align: left;
          }
          .consolidation-table td {
            border-bottom: 1px solid #eaeaea;
          }
          .consolidation-table td:first-child, .consolidation-table th:first-child {
            position: sticky;
            left: 0;
            z-index: 5;
          }
          .consolidation-table th:first-child {
            z-index: 11;
          }
        `}} />
        <table className="consolidation-table">
          <thead>
            <tr>
              {isLocked && (
                <th style={{ textAlign: 'center', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedItemIds.size === consolidatedItems.length && consolidatedItems.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              <th>Item Code</th>
              <th>Category</th>
              <th>Description</th>
              <th style={{ textAlign: 'center' }}>Sync Status</th>
              <th style={{ textAlign: 'right' }}>Total Qty</th>
              <th>Unit</th>
              <th style={{ textAlign: 'right' }}>Unit Cost</th>
              <th style={{ textAlign: 'right' }}>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {consolidatedItems.map((item) => (
              <tr key={item.id} style={{ backgroundColor: selectedItemIds.has(item.id) ? 'rgba(0, 255, 163, 0.05)' : 'transparent' }}>
                {isLocked && (
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox"
                      checked={selectedItemIds.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                    />
                  </td>
                )}
                <td style={{ fontWeight: 'bold' }}>{item.itemCode}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{item.category || 'N/A'}</td>
                <td>{item.description}</td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    backgroundColor: '#dcfce7', 
                    color: '#166534', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    ✓ AI Mapped
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {item.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td>{item.unit}</td>
                <td style={{ textAlign: 'right' }}>
                  ₱ {item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                  ₱ {item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={isLocked ? 8 : 7} style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.05rem', padding: '15px 10px', backgroundColor: '#e0e0e0', position: 'sticky', bottom: 0, zIndex: 10, borderTop: '2px solid #ccc' }}>
                GRAND TOTAL:
              </th>
              <th style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.05rem', padding: '15px 10px', color: 'var(--accent-color)', backgroundColor: '#e0e0e0', position: 'sticky', bottom: 0, zIndex: 10, borderTop: '2px solid #ccc' }}>
                ₱ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
