'use client';

export default function BatchDetailClient({ batch }: { batch: any }) {
  
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    if (batch.paymentMethodType === 'GCASH') {
      csvContent += "Payslip ID,Worker Name,GCash Number,Amount,Status\n";
      batch.rows.forEach((row: any) => {
        const w = row.worker;
        csvContent += `${row.payrollId},"${w.firstName} ${w.lastName}",${w.gcashNumber},${row.amount},${row.status}\n`;
      });
    } else {
      csvContent += "Payslip ID,Worker Name,Bank Name,Account Number,Account Name,Amount,Status\n";
      batch.rows.forEach((row: any) => {
        const w = row.worker;
        csvContent += `${row.payrollId},"${w.firstName} ${w.lastName}",${w.bankName},${w.bankAccountNumber},"${w.bankAccountName}",${row.amount},${row.status}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Batch_${batch.batchNumber}_${batch.paymentMethodType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isExportDisabled = !batch.aiRiskLevel || batch.aiRiskLevel === 'BLOCKED';

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Included Payslips</h2>
        <button 
          onClick={handleExportCSV}
          disabled={isExportDisabled}
          style={{ background: isExportDisabled ? '#7f8c8d' : '#3498db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: isExportDisabled ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
          title={isExportDisabled ? "Must pass AI Audit before export" : "Export to CSV"}
        >
          Export CSV (Phase 5)
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '12px 8px', color: '#888' }}>Payslip #</th>
              <th style={{ padding: '12px 8px', color: '#888' }}>Worker</th>
              {batch.paymentMethodType === 'GCASH' ? (
                <th style={{ padding: '12px 8px', color: '#888' }}>GCash Number</th>
              ) : (
                <>
                  <th style={{ padding: '12px 8px', color: '#888' }}>Bank Name</th>
                  <th style={{ padding: '12px 8px', color: '#888' }}>Account Number</th>
                </>
              )}
              <th style={{ padding: '12px 8px', color: '#888' }}>Amount</th>
              <th style={{ padding: '12px 8px', color: '#888' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {batch.rows.map((row: any) => {
              const w = row.worker;
              return (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '12px 8px' }}>{row.payrollId.substring(0,8)}</td>
                  <td style={{ padding: '12px 8px' }}>{w.firstName} {w.lastName}</td>
                  
                  {batch.paymentMethodType === 'GCASH' ? (
                    <td style={{ padding: '12px 8px' }}>{w.gcashNumber}</td>
                  ) : (
                    <>
                      <td style={{ padding: '12px 8px' }}>{w.bankName}</td>
                      <td style={{ padding: '12px 8px' }}>{w.bankAccountNumber}</td>
                    </>
                  )}
                  
                  <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>₱ {row.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px' }}>{row.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
