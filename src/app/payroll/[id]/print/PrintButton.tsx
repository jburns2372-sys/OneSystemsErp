'use client';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="no-print"
      style={{
        background: '#3498db',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem'
      }}
    >
      🖨️ Print / Save as PDF
    </button>
  );
}
