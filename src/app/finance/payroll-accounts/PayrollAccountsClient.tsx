'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPayrollAccount } from '@/app/actions/payrollBankActions';

import Link from 'next/link';

export default function PayrollAccountsClient({ accounts }: { accounts: any[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    bankBranch: '',
    accountNumber: '',
    accountName: '',
    currency: 'PHP',
    beginningBalance: 0
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'beginningBalance' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // In production, use real logged-in user ID
    const currentUserId = 'clxw8xxvj0000vwu4xxw8xxvj'; 
    
    const res = await createPayrollAccount(formData, currentUserId);
    setLoading(false);
    
    if (res.success) {
      alert('Payroll Bank Account created successfully!');
      setIsModalOpen(false);
      router.refresh();
    } else {
      alert('Error: ' + res.error);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Add Bank Account
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {accounts.map(acc => (
          <Link key={acc.id} href={`/finance/payroll-accounts/${acc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '16px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{acc.bankName}</h2>
              <span style={{ 
                background: acc.status === 'ACTIVE' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', 
                color: acc.status === 'ACTIVE' ? '#2ecc71' : '#e74c3c', 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {acc.status}
              </span>
            </div>
            
            <p style={{ margin: '0 0 5px 0', color: 'var(--text-secondary)' }}>Acct No: <strong style={{ color: '#fff' }}>{acc.accountNumber}</strong></p>
            <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)' }}>Acct Name: {acc.accountName}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Available Balance</span>
                <strong style={{ fontSize: '1.2rem', color: '#2ecc71' }}>₱ {acc.currentAvailableBalance.toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Reserved for Payroll</span>
                <strong style={{ fontSize: '1.2rem', color: '#e67e22' }}>₱ {acc.reservedPayrollBalance.toLocaleString()}</strong>
              </div>
            </div>
            </div>
          </Link>
        ))}
        
        {accounts.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            No Payroll Bank Accounts set up yet.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 15, 26, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', width: '100%', maxWidth: '600px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#fff' }}>Add Payroll Bank Account</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Bank Name</label>
                  <input required name="bankName" value={formData.bankName} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Branch</label>
                  <input name="bankBranch" value={formData.bankBranch} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Account Number</label>
                  <input required name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Account Name</label>
                  <input required name="accountName" value={formData.accountName} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Beginning Balance (₱)</label>
                <input type="number" step="0.01" required name="beginningBalance" value={formData.beginningBalance} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: 'var(--accent-color)', color: '#000', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
