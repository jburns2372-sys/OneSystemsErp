'use client';

export default function GovernmentSettings({ govSettings }: { govSettings: any }) {
  // Normally we would have state for all these, but this is a stub for the UI layout
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', color: '#fff' }}>Government Deductions Configuration</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Configure rates, limits, and schedules for SSS, PhilHealth, Pag-IBIG, and Tax.</p>
        </div>
        <button style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Save Configuration
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* SSS Configuration */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#3498db', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>SSS</span> 
              Social Security System
            </h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enabled</span>
            </label>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            SSS deductions use the standard Contribution Table based on the worker's monthly salary credit.
          </div>
          
          <button style={{ background: 'transparent', border: '1px solid #3498db', color: '#3498db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', width: '100%' }}>
            View & Edit SSS Contribution Table
          </button>
        </div>

        {/* PhilHealth Configuration */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#2ecc71', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>PHIC</span> 
              PhilHealth
            </h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enabled</span>
            </label>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Premium Rate (%)</label>
              <input type="number" defaultValue="5.0" step="0.1" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Split Type</label>
              <select style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}>
                <option value="50_50" style={{ background: 'var(--bg-secondary)' }}>50/50 (Emp/ER)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Salary Floor (₱)</label>
              <input type="number" defaultValue="10000" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Salary Ceiling (₱)</label>
              <input type="number" defaultValue="100000" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* Pag-IBIG Configuration */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#e74c3c', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>HDMF</span> 
              Pag-IBIG Fund
            </h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enabled</span>
            </label>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Employee Rate (%)</label>
              <input type="number" defaultValue="2.0" step="0.1" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Employer Rate (%)</label>
              <input type="number" defaultValue="2.0" step="0.1" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Maximum Compensation Base (₱)</label>
              <input type="number" defaultValue="10000" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* Withholding Tax (BIR) Configuration */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#f39c12', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>BIR</span> 
              Withholding Tax (WHT)
            </h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enabled</span>
            </label>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Withholding tax is computed using the standard <strong>TRAIN / CREATE Law</strong> tables. Only applies to workers flagged as "Taxable".
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '0.85rem', color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '5px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Taxable Income Range (Semi-Monthly)</span>
              <span style={{ color: 'var(--text-secondary)' }}>Standard Rate</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>₱0 - ₱10,417</span>
              <span style={{ color: '#2ecc71' }}>0%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>₱10,417 - ₱16,666</span>
              <span>15%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>₱16,667 - ₱33,332</span>
              <span>₱937.50 + 20%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>₱33,333 - ₱83,332</span>
              <span>₱4,270.70 + 25%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>₱83,333 - ₱333,332</span>
              <span>₱16,770.70 + 30%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>₱333,333 and above</span>
              <span style={{ color: '#e74c3c' }}>₱91,770.70 + 35%</span>
            </div>
          </div>
        </div>


        {/* Global Schedule */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1.2rem' }}>Deduction Schedule Strategy</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>Determine when these deductions are processed during the month to avoid burdening the employee in a single cutoff.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <input type="radio" name="schedule" value="SPLIT_EQUALLY" defaultChecked />
              <div>
                <div style={{ fontWeight: 'bold' }}>Split Equally</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Divides the monthly contribution across all payrolls in the month.</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <input type="radio" name="schedule" value="FIRST_PAYROLL" />
              <div>
                <div style={{ fontWeight: 'bold' }}>First Payroll Only</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Deducts the entire monthly contribution during the 1st cutoff.</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <input type="radio" name="schedule" value="SECOND_PAYROLL" />
              <div>
                <div style={{ fontWeight: 'bold' }}>Second Payroll Only</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Deducts the entire monthly contribution during the 2nd cutoff.</div>
              </div>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
