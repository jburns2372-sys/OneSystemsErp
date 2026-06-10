'use client';

import { useState } from 'react';
import styles from '../../projects/page.module.css';
import LogPCExpenseModal from './LogPCExpenseModal';
import ReplenishmentModal from './ReplenishmentModal';
import ReplenishmentDetailsModal from './ReplenishmentDetailsModal';

export default function PCLedgerClient({ account, users }: { account: any, users: any[] }) {
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'REPLENISHMENTS'>('EXPENSES');
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [isReplenishOpen, setIsReplenishOpen] = useState(false);
  const [selectedReplenishment, setSelectedReplenishment] = useState<any>(null);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button 
            onClick={() => setActiveTab('EXPENSES')}
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'EXPENSES' ? 'var(--accent-color)' : '#aaa', 
              fontSize: '1.1rem', fontWeight: activeTab === 'EXPENSES' ? 'bold' : 'normal', cursor: 'pointer',
              borderBottom: activeTab === 'EXPENSES' ? '2px solid var(--accent-color)' : 'none', paddingBottom: '5px'
            }}>
            Expenses Ledger
          </button>
          <button 
            onClick={() => setActiveTab('REPLENISHMENTS')}
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'REPLENISHMENTS' ? 'var(--accent-color)' : '#aaa', 
              fontSize: '1.1rem', fontWeight: activeTab === 'REPLENISHMENTS' ? 'bold' : 'normal', cursor: 'pointer',
              borderBottom: activeTab === 'REPLENISHMENTS' ? '2px solid var(--accent-color)' : 'none', paddingBottom: '5px'
            }}>
            Replenishments
          </button>
        </div>
        
        <div>
          {activeTab === 'EXPENSES' && (
            <button onClick={() => setIsLogExpenseOpen(true)} className={styles.primaryButton}>
              + Log Expense
            </button>
          )}
          {activeTab === 'REPLENISHMENTS' && (
            <button onClick={() => setIsReplenishOpen(true)} className={styles.primaryButton}>
              + Request Replenishment
            </button>
          )}
        </div>
      </div>

      <div className={styles.tableContainer}>
        {activeTab === 'EXPENSES' ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Payee</th>
                <th>Purpose</th>
                <th>Category</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {account.expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>No expenses logged in this fund yet.</td>
                </tr>
              ) : account.expenses.map((exp: any) => (
                <tr key={exp.id}>
                  <td>{new Date(exp.date).toLocaleDateString()}</td>
                  <td>{exp.payee}</td>
                  <td>{exp.purpose}</td>
                  <td>{exp.category}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem',
                      background: exp.status === 'PENDING' ? 'rgba(255,165,0,0.2)' : 'rgba(0,255,163,0.2)',
                      color: exp.status === 'PENDING' ? '#ffa500' : 'var(--accent-color)'
                    }}>
                      {exp.status}
                    </span>
                  </td>
                  <td className={styles.amount}>
                    ₱ {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Req No.</th>
                <th>Date</th>
                <th>Status</th>
                <th>Amount Requested</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {account.replenishments.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>No replenishments requested yet.</td>
                </tr>
              ) : account.replenishments.map((rep: any) => (
                <tr key={rep.id}>
                  <td style={{ fontWeight: 'bold' }}>{rep.requestNumber}</td>
                  <td>{new Date(rep.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem',
                      background: rep.status === 'CLOSED' ? 'rgba(0,255,163,0.2)' : 'rgba(255,255,255,0.1)',
                      color: rep.status === 'CLOSED' ? 'var(--accent-color)' : '#fff'
                    }}>
                      {rep.status}
                    </span>
                  </td>
                  <td className={styles.amount}>
                    ₱ {rep.amountRequested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>
                    <button onClick={() => setSelectedReplenishment(rep)} style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isLogExpenseOpen && (
        <LogPCExpenseModal 
          account={account} 
          users={users} 
          onClose={() => setIsLogExpenseOpen(false)} 
        />
      )}

      {isReplenishOpen && (
        <ReplenishmentModal 
          account={account} 
          onClose={() => setIsReplenishOpen(false)} 
        />
      )}

      {selectedReplenishment && (
        <ReplenishmentDetailsModal 
          replenishment={selectedReplenishment} 
          users={users} 
          onClose={() => setSelectedReplenishment(null)} 
        />
      )}
    </>
  );
}
