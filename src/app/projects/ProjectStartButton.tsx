'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProjectProfile } from '@/app/actions/project-intake';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid rgba(148,163,184,.35)', background: '#0f172a',
  color: '#f8fafc', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 5 };

function generateSubmissionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ProjectStartButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [submissionToken, setSubmissionToken] = useState<string>('');
  const inFlightRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  function openModal() {
    setError('');
    setCreatedProjectId(null);
    setSubmitting(false);
    inFlightRef.current = false;
    setSubmissionToken(generateSubmissionToken());
    setOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setOpen(false);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlightRef.current || submitting || createdProjectId) {
      return;
    }

    inFlightRef.current = true;
    setSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const activeToken = submissionToken || generateSubmissionToken();
    formData.set('submissionToken', activeToken);

    try {
      const result = await createProjectProfile(formData);
      if ('error' in result && result.error) {
        setError(result.error);
        setSubmitting(false);
        inFlightRef.current = false;
        return;
      }

      if ('projectId' in result && result.projectId) {
        const targetUrl = '/projects/' + encodeURIComponent(result.projectId) + '/documents';
        setCreatedProjectId(result.projectId);
        setSubmitting(false);
        // Navigate directly to the new project's Documents page without triggering
        // a competing route refresh in the same transition (which cancels navigation
        // in Next.js 16 / React 19 and traps the modal in a pending state).
        router.push(targetUrl);
        fallbackTimerRef.current = setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
            window.location.assign(targetUrl);
          }
        }, 3500);
        return;
      }

      setError('Could not confirm project creation. Please check the Projects list before retrying.');
      setSubmitting(false);
      inFlightRef.current = false;
    } catch {
      setError('Could not create project right now. Please check the Projects list before trying again.');
      setSubmitting(false);
      inFlightRef.current = false;
    }
  }

  const createdDocsUrl = createdProjectId
    ? '/projects/' + encodeURIComponent(createdProjectId) + '/documents'
    : null;

  return (
    <>
      <button type="button" onClick={openModal} className="btn-primary">+ Create Project</button>
      {open && (
        <div role="presentation" style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.78)',display:'grid',placeItems:'center',padding:16}}>
          <section role="dialog" aria-modal="true" aria-labelledby="project-create-heading"
            style={{width:'min(100%,640px)',maxHeight:'90vh',overflowY:'auto',padding:24,borderRadius:14,background:'#1e293b',color:'#fff',border:'1px solid #475569'}}>
            <h2 id="project-create-heading" style={{marginTop:0}}>Create Project</h2>

            {createdDocsUrl ? (
              <div role="status" aria-live="polite" style={{display:'grid',gap:14}}>
                <p style={{margin:0,color:'#6ee7b7',fontWeight:600}}>
                  Project created successfully. Opening Documents &amp; BOQ Upload…
                </p>
                <p style={{margin:0,color:'#cbd5e1',fontSize:14}}>
                  If the page does not open automatically, click below to continue.
                </p>
                <div style={{display:'flex',justifyContent:'flex-end',gap:10,flexWrap:'wrap'}}>
                  <Link
                    href={createdDocsUrl}
                    style={{padding:'10px 16px',color:'#042f2e',background:'#22d3ee',fontWeight:700,borderRadius:8,textDecoration:'none'}}
                  >
                    Open Project Documents &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p style={{color:'#94a3b8',fontSize:14}}>Start with basic details. Upload BOQ and supporting documents next; no file is required now.</p>
                <form onSubmit={handleSubmit} style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:14}}>
                  <div style={{gridColumn:'1 / -1'}}>
                    <label htmlFor="project-name" style={labelStyle}>Project Name *</label>
                    <input id="project-name" name="name" required minLength={3} maxLength={180} style={inputStyle} autoFocus disabled={submitting} />
                  </div>
                  <div style={{gridColumn:'1 / -1'}}>
                    <label htmlFor="project-sector" style={labelStyle}>Project Sector *</label>
                    <select id="project-sector" name="sector" required defaultValue="" style={inputStyle} disabled={submitting}>
                      <option value="" disabled>Select sector</option>
                      <option value="GOVERNMENT">Government / LGU / Agency</option>
                      <option value="CORPORATE">Corporate</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="project-client" style={labelStyle}>Client / Owner</label>
                    <input id="project-client" name="client" maxLength={250} style={inputStyle} disabled={submitting}/>
                  </div>
                  <div>
                    <label htmlFor="project-ref" style={labelStyle}>Contract Reference</label>
                    <input id="project-ref" name="contractNumber" maxLength={250} style={inputStyle} disabled={submitting}/>
                  </div>
                  <div style={{gridColumn:'1 / -1'}}>
                    <label htmlFor="project-location" style={labelStyle}>Location</label>
                    <input id="project-location" name="location" maxLength={250} style={inputStyle} disabled={submitting}/>
                  </div>
                  <div style={{gridColumn:'1 / -1'}}>
                    <label htmlFor="project-notes" style={labelStyle}>Notes (optional)</label>
                    <textarea id="project-notes" name="description" maxLength={2000} rows={2} style={inputStyle} disabled={submitting}/>
                  </div>
                  {error && <div role="alert" style={{gridColumn:'1 / -1',color:'#fca5a5'}}>{error}</div>}
                  <div style={{gridColumn:'1 / -1',display:'flex',justifyContent:'flex-end',gap:10}}>
                    <button type="button" onClick={closeModal} disabled={submitting}
                      style={{padding:'10px 16px',color:'#e2e8f0',background:'transparent',border:'1px solid #64748b',borderRadius:8,cursor:submitting?'not-allowed':'pointer'}}>Cancel</button>
                    <button type="submit" disabled={submitting}
                      style={{padding:'10px 16px',color:'#042f2e',background:'#22d3ee',fontWeight:700,border:0,borderRadius:8,cursor:submitting?'wait':'pointer',opacity:submitting?0.7:1}}>
                      {submitting ? 'Creating...' : 'Create & Open Documents'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
