'use client';

export default function PrintableCanvass({ canvass, onClose }: { canvass: any, onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#fff', color: '#000', zIndex: 9999, overflowY: 'auto' }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end', background: '#f1f1f1' }} className="no-print">
        <button onClick={() => window.print()} style={{ marginRight: '10px', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>🖨️ Print Document</button>
        <button onClick={onClose} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Close</button>
      </div>

      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }} className="print-container">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            .no-print { display: none !important; }
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          }
        `}} />
        
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '2px' }}>JEJORS CONSTRUCTION CORPORATION</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555', textTransform: 'uppercase' }}>Supplier Canvass Form</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '14px' }}>
          <div>
            <p style={{ margin: '5px 0' }}><strong>Canvass No:</strong> {canvass.canvassNumber}</p>
            <p style={{ margin: '5px 0' }}><strong>Date Generated:</strong> {new Date(canvass.createdAt).toLocaleDateString()}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '5px 0' }}><strong>Project:</strong> {canvass.project?.name || 'N/A'}</p>
            <p style={{ margin: '5px 0' }}><strong>MRF Reference:</strong> {canvass.mr?.mrNumber}</p>
          </div>
        </div>

        <p style={{ marginBottom: '5px', fontStyle: 'italic', color: '#444' }}>Please provide your best quotation for the following items. This is a request for pricing, not a Purchase Order.</p>
        <p style={{ marginBottom: '20px', fontWeight: 'bold', color: '#000', fontSize: '15px' }}>PLEASE EMAIL THE QUOTATION TO: procurement@onesystemserp.com</p>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Item Code</th>
              <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Description</th>
              <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>Req. Qty</th>
              <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>Unit</th>
              <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '120px' }}>Unit Price (₱)</th>
              <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '120px' }}>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {canvass.items.map((item: any) => (
              <tr key={item.id}>
                <td style={{ border: '1px solid #000', padding: '10px' }}>{item.consolidatedBoqItem.itemCode}</td>
                <td style={{ border: '1px solid #000', padding: '10px' }}>{item.consolidatedBoqItem.description}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{item.quantityRequired}</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{item.consolidatedBoqItem.unit}</td>
                <td style={{ border: '1px solid #000', padding: '10px' }}></td>
                <td style={{ border: '1px solid #000', padding: '10px' }}></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <div style={{ width: '40%' }}>
            <p>Prepared By:</p>
            <div style={{ borderBottom: '1px solid #000', height: '30px', marginTop: '30px' }}></div>
            <p style={{ textAlign: 'center', marginTop: '5px' }}>{canvass.preparedBy?.name || 'Authorized Procurement Officer'}</p>
          </div>
          <div style={{ width: '40%' }}>
            <p>Supplier Conforme:</p>
            <div style={{ borderBottom: '1px solid #000', height: '30px', marginTop: '30px' }}></div>
            <p style={{ textAlign: 'center', marginTop: '5px' }}>Signature Over Printed Name / Date</p>
          </div>
        </div>

        <div style={{ marginTop: '50px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          <p>This is a system generated form. Valid for 30 days.</p>
        </div>
      </div>
    </div>
  );
}
