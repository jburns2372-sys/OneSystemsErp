'use client';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="no-print"
      style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
    >
      🖨️ Print Document
    </button>
  );
}
