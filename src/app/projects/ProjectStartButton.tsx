'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createProjectProfile } from '@/app/actions/project-intake';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid rgba(148,163,184,.35)', background: '#0f172a',
  color: '#f8fafc', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 5 };

export default function ProjectStartButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function create(formData: FormData) {
    setError('');
    startTransition(async () => {
      try {
        const result = await createProjectProfile(formData);
        if ('error' in result && result.error) {
          setError(result.error);
          return;
        }
        if ('projectId' in result) {
          router.push('/projects/' + encodeURIComponent(result.projectId) + '/documents');
          router.refresh();
        }
      } catch {
        setError('Could not create project. Nothing was imported; please try again.');
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">+ Create Project</button>
      {open && (
        <div role="presentation" style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.78)',display:'grid',placeItems:'center',padding:16}}>
          <section role="dialog" aria-modal="true" aria-labelledby="project-create-heading"
            style={{width:'min(100%,640px)',maxHeight:'90vh',overflowY:'auto',padding:24,borderRadius:14,background:'#1e293b',color:'#fff',border:'1px solid #475569'}}>
            <h2 id="project-create-heading" style={{marginTop:0}}>Create Project</h2>
            <p style={{color:'#94a3b8',fontSize:14}}>Start with basic details. Upload BOQ and supporting documents next; no file is required now.</p>
            <form action={create} style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:14}}>
              <div style={{gridColumn:'1 / -1'}}>
                <label htmlFor="project-name" style={labelStyle}>Project Name *</label>
                <input id="project-name" name="name" required minLength={3} maxLength={180} style={inputStyle} autoFocus />
              </div>
              <div style={{gridColumn:'1 / -1'}}>
                <label htmlFor="project-sector" style={labelStyle}>Project Sector *</label>
                <select id="project-sector" name="sector" required defaultValue="" style={inputStyle}>
                  <option value="" disabled>Select sector</option>
                  <option value="GOVERNMENT">Government / LGU / Agency</option>
                  <option value="CORPORATE">Corporate</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
              <div>
                <label htmlFor="project-client" style={labelStyle}>Client / Owner</label>
                <input id="project-client" name="client" maxLength={250} style={inputStyle}/>
              </div>
              <div>
                <label htmlFor="project-ref" style={labelStyle}>Contract Reference</label>
                <input id="project-ref" name="contractNumber" maxLength={250} style={inputStyle}/>
              </div>
              <div style={{gridColumn:'1 / -1'}}>
                <label htmlFor="project-location" style={labelStyle}>Location</label>
                <input id="project-location" name="location" maxLength={250} style={inputStyle}/>
              </div>
              <div style={{gridColumn:'1 / -1'}}>
                <label htmlFor="project-notes" style={labelStyle}>Notes (optional)</label>
                <textarea id="project-notes" name="description" maxLength={2000} rows={2} style={inputStyle}/>
              </div>
              {error && <div role="alert" style={{gridColumn:'1 / -1',color:'#fca5a5'}}>{error}</div>}
              <div style={{gridColumn:'1 / -1',display:'flex',justifyContent:'flex-end',gap:10}}>
                <button type="button" onClick={() => { setOpen(false);setError(''); }} disabled={pending}
                  style={{padding:'10px 16px',color:'#e2e8f0',background:'transparent',border:'1px solid #64748b',borderRadius:8}}>Cancel</button>
                <button type="submit" disabled={pending}
                  style={{padding:'10px 16px',color:'#042f2e',background:'#22d3ee',fontWeight:700,border:0,borderRadius:8}}>
                  {pending ? 'Creating...' : 'Create & Open Documents'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
