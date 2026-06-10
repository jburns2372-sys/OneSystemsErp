'use client';

export default function ExportWorkersButton({ workers }: { workers: any[] }) {
  const handleExport = () => {
    // Define headers
    const headers = [
      'Worker ID',
      'First Name',
      'Middle Name',
      'Last Name',
      'Designation',
      'Department',
      'Worker Category',
      'Employment Type',
      'Status',
      'Rate Type',
      'Daily Rate',
      'Monthly Salary',
      'TIN',
      'SSS',
      'PhilHealth',
      'Pag-IBIG'
    ];

    // Map workers to CSV rows
    const rows = workers.map(w => [
      w.workerId || '',
      w.firstName || '',
      w.middleName || '',
      w.lastName || '',
      w.designation || '',
      w.department || '',
      w.workerCategory || '',
      w.employmentType || '',
      w.employmentStatus || '',
      w.rateType || '',
      w.dailyRate || 0,
      w.basicMonthlySalary || 0,
      w.tinNumber || '',
      w.sssNumber || '',
      w.philHealthNumber || '',
      w.pagIbigNumber || ''
    ]);

    // Construct CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Workers_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExport}
      style={{
        background: 'rgba(46, 204, 113, 0.2)', 
        color: '#2ecc71', 
        border: '1px solid rgba(46, 204, 113, 0.4)',
        padding: '10px 20px', 
        borderRadius: '8px', 
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Export CSV
    </button>
  );
}
