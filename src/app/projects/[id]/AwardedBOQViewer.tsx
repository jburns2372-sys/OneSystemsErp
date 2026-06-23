'use client';

import { useState } from 'react';

export default function AwardedBOQViewer({ htmlTable, consolidatedHtmlTable }: { htmlTable: string, consolidatedHtmlTable?: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConsolidatedView, setIsConsolidatedView] = useState(false);

  if (!htmlTable) {
    return <p style={{ color: 'var(--text-secondary)' }}>No original Excel file found to display. Please upload one from the Projects screen.</p>;
  }

  return (
    <div className={isFullscreen ? "fullscreen-wrapper" : "normal-wrapper"}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '10px' }}>
        {consolidatedHtmlTable && (
          <button
            onClick={() => setIsConsolidatedView(!isConsolidatedView)}
            className="btn-primary"
            style={{
              background: isConsolidatedView ? 'linear-gradient(135deg, var(--accent-color) 0%, #0891b2 100%)' : 'transparent',
              color: isConsolidatedView ? '#fff' : 'var(--accent-color)',
              borderColor: 'var(--accent-color)',
              fontWeight: 'bold',
              zIndex: 10000
            }}
          >
            {isConsolidatedView ? 'View Raw Awarded BOQ' : '⚙️ Consolidated BOQ (For Schedule)'}
          </button>
        )}
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

      <div className="table-scroll-container">
        <style dangerouslySetInnerHTML={{__html: `
          .fullscreen-wrapper {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: var(--bg-dark);
            z-index: 9999;
            padding: 20px;
            display: flex;
            flex-direction: column;
          }
          .normal-wrapper {
            position: relative;
            background-color: #fff;
            padding: 15px;
            border-radius: 8px;
          }
          .table-scroll-container {
            overflow: auto;
            flex-grow: 1;
            max-height: ${isFullscreen ? 'calc(100vh - 80px)' : '600px'};
            border: 1px solid #ccc;
          }
          .excel-table-wrapper table { 
            border-collapse: separate; 
            border-spacing: 0;
            width: 100%; 
            color: #000; 
            font-size: 0.85rem; 
            background: #fff;
            table-layout: auto;
          }
          .excel-table-wrapper td, .excel-table-wrapper th { 
            border: 1px solid #ccc; 
            padding: 6px 10px; 
            white-space: normal;
            word-wrap: break-word;
            vertical-align: top;
          }
          
          /* Freeze the first few rows (assuming headers are around row 4) */
          .excel-table-wrapper tr:nth-child(-n+4) td {
            position: sticky;
            top: 0;
            background: #e0e0e0;
            font-weight: bold;
            z-index: 2;
            box-shadow: 0 2px 2px rgba(0,0,0,0.1);
          }
          
          /* Freeze the first column */
          .excel-table-wrapper tr td:first-child {
            position: sticky;
            left: 0;
            background: #f8f9fa;
            font-weight: bold;
            z-index: 1;
            box-shadow: 2px 0 2px rgba(0,0,0,0.1);
          }

          /* Corner cell (both top and left sticky) */
          .excel-table-wrapper tr:nth-child(-n+4) td:first-child {
            z-index: 3;
            background: #d0d0d0;
          }
        `}} />
        <div 
          className="excel-table-wrapper"
          dangerouslySetInnerHTML={{ __html: isConsolidatedView && consolidatedHtmlTable ? consolidatedHtmlTable : htmlTable }} 
        />
      </div>
    </div>
  );
}
