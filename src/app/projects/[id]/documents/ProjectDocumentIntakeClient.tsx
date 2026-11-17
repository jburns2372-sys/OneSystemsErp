'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type DocumentRow = {
  id: string;
  fileName: string;
  documentRole: string;
  byteSize: number;
  createdAt: string;
  sha256: string;
  latestSnapshotStatus: string | null;
};

const EVIDENCE_TYPES: Array<[string, string]> = [
  ['CONTRACT_BOQ', 'Awarded / Contract BOQ (extract and stage)'],
  ['CONTRACT', 'Contract / NOA / NTP'],
  ['AGENCY_ESTIMATE', 'Agency estimate / POW'],
  ['DUPA', 'Detailed unit price analysis (DUPA)'],
  ['TECHNICAL_SPEC', 'Technical specifications'],
  ['DRAWING', 'Drawing / schematic evidence'],
  ['SCHEDULE', 'Schedule / S-curve'],
  ['PROCUREMENT', 'Procurement / subcontracting'],
  ['PROGRESS_EVIDENCE', 'Inspection / progress evidence'],
  ['FINANCIAL_EVIDENCE', 'Financial / billing evidence'],
  ['PERMIT', 'Permit / compliance'],
  ['OTHER', 'Other project evidence'],
];

const TAX_PROFILES: Record<string, Array<[string, string]>> = {
  GOVERNMENT: [['GOV_PH_DUPA_5PCT_EST', 'Government (DPWH-style estimate / VAT profile)']],
  CORPORATE: [
    ['CORP_PH_VAT_EXCL_12', 'Corporate – price excludes 12% VAT'],
    ['CORP_PH_VAT_INCL_12', 'Corporate – price includes 12% VAT'],
    ['PEZA_ZERO_RATED_0', 'Corporate – PEZA zero-rated'],
  ],
  PRIVATE: [['PRIVATE_NON_VAT_EXEMPT', 'Private non-VAT / exempt']],
};

export default function ProjectDocumentIntakeClient(props: {
  projectId: string;
  sector: string;
  canStageBoq: boolean;
  canUploadEvidence: boolean;
  files: DocumentRow[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState('CONTRACT_BOQ');
  const [tax, setTax] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const taxes = TAX_PROFILES[props.sector] || [];
  const activeTax = taxes.some(([code]) => code === tax) ? tax : '';
  const isBoq = role === 'CONTRACT_BOQ';
  const canUpload = isBoq ? props.canStageBoq : props.canUploadEvidence;

  async function upload() {
    if (!canUpload) { setResults(['Your role cannot upload this document category.']); return; }
    const files = Array.from(input.current?.files || []);
    if (!files.length) { setResults(['Select one or more files.']); return; }
    if (isBoq && !activeTax) {
      setResults(['Select and confirm a tax/price profile before BOQ staging.']);
      return;
    }
    setBusy(true);
    const completed: string[] = [];
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        completed.push(file.name + ': exceeds 25 MB document intake limit');
        continue;
      }
      const form = new FormData();
      form.set('file', file);
      form.set('projectId', props.projectId);
      form.set('documentRole', role);
      if (isBoq) {
        form.set('sectorType', props.sector);
        form.set('taxProfileCode', activeTax);
      }
      try {
        const url = isBoq
          ? '/api/uboq/intake'
          : '/api/projects/' + encodeURIComponent(props.projectId) + '/documents';
        const res = await fetch(url, { method: 'POST', body: form, credentials: 'same-origin' });
        const value = await res.json().catch(() => ({}));
        if (!res.ok) {
          completed.push(file.name + ': ' + (value.error || 'Upload failed (' + res.status + ')'));
        } else {
          completed.push(file.name + ': ' + (isBoq ? 'BOQ staged for review' : 'Stored as evidence') +
            (value.duplicate || value.duplicateIdempotentReplay ? ' (existing file)' : ''));
        }
      } catch {
        completed.push(file.name + ': network error; retry or check whether file was already stored');
      }
    }
    setResults(completed);
    if (input.current) input.current.value = '';
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{display:'grid',gap:20}}>
      <section style={{padding:20,background:'#1e293b',border:'1px solid #475569',borderRadius:14}}>
        <h2 style={{margin:'0 0 8px'}}>Upload Project Documents</h2>
        <p style={{color:'#94a3b8',margin:'0 0 16px'}}>
          Upload BOQ to a reviewable draft. Contracts, drawings and other supporting files are retained as immutable evidence without altering BOQ or financial baselines.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12,marginBottom:14}}>
          <label style={{display:'grid',gap:5}}>
            <span>Document classification</span>
            <select value={role} onChange={e => setRole(e.target.value)}
              style={{padding:11,background:'#0f172a',color:'#f8fafc',border:'1px solid #64748b',borderRadius:7}}>
              {EVIDENCE_TYPES.map(([value,label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          {isBoq && <label style={{display:'grid',gap:5}}>
            <span>Tax / price basis (required for BOQ)</span>
            <select required value={activeTax} onChange={e => setTax(e.target.value)}
              style={{padding:11,background:'#0f172a',color:'#f8fafc',border:'1px solid #64748b',borderRadius:7}}>
              <option value="">Confirm applicable profile</option>
              {taxes.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>}
        </div>
        {!canUpload && <p role="status" style={{color:'#fbbf24'}}>Your role has view access but not permission to upload this document category.</p>}
        <input ref={input} type="file" multiple
          disabled={!canUpload || busy}
          accept=".xlsx,.xls,.csv,.pdf,.docx,.png,.jpg,.jpeg,.json,.xml,.html"
          aria-label="Select project files"
          style={{padding:16,border:'2px dashed #475569',width:'100%',maxWidth:'100%',boxSizing:'border-box',borderRadius:10}}/>
        <p style={{fontSize:12,color:'#94a3b8'}}>
          Files upload individually using the existing secure intake. Up to 25 MB per file at the application layer; your hosting platform may impose a smaller request limit. Files must pass content security checks.
        </p>
        <button type="button" onClick={upload} disabled={busy || !canUpload}
          style={{background:'#22d3ee',color:'#042f2e',padding:'11px 18px',border:0,borderRadius:8,fontWeight:700,cursor:'pointer'}}>
          {busy ? 'Uploading and validating...' : 'Upload Selected Documents'}
        </button>
        {results.length>0 && <div role="status" aria-live="polite" style={{marginTop:12}}>
          {results.map((line,i)=><p key={i} style={{margin:'5px 0',color:'#e2e8f0'}}>{line}</p>)}
        </div>}
      </section>

      <section style={{padding:20,background:'#1e293b',border:'1px solid #475569',borderRadius:14}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
          <h2 style={{margin:0}}>Document Register ({props.files.length})</h2>
          <Link href={'/projects/'+encodeURIComponent(props.projectId)+'/uboq'} style={{color:'#67e8f9'}}>
            Review BOQ &amp; Snapshots →
          </Link>
        </div>
        {!props.files.length ? (
          <p style={{color:'#94a3b8'}}>No documents uploaded yet. Start by uploading an awarded BOQ or the contract package.</p>
        ) : (
          <div style={{overflowX:'auto',marginTop:16}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr style={{textAlign:'left',color:'#94a3b8'}}>
                <th style={{padding:10}}>Filename</th><th style={{padding:10}}>Category</th>
                <th style={{padding:10}}>Status</th><th style={{padding:10}}>Uploaded</th><th style={{padding:10}}>Action</th>
              </tr></thead>
              <tbody>{props.files.map(f => <tr key={f.id} style={{borderTop:'1px solid #334155'}}>
                <td style={{padding:10}}>{f.fileName}<div style={{fontSize:11,color:'#64748b'}}>SHA-256 {f.sha256.slice(0,12)}… · {(f.byteSize/1024).toFixed(1)} KB</div></td>
                <td style={{padding:10}}>{f.documentRole.replaceAll('_',' ')}</td>
                <td style={{padding:10}}>{f.latestSnapshotStatus || 'Evidence preserved'}</td>
                <td style={{padding:10}}>{new Date(f.createdAt).toLocaleDateString()}</td>
                <td style={{padding:10}}>
                  <a style={{color:'#67e8f9'}}
                    href={'/api/projects/'+encodeURIComponent(props.projectId)+'/documents/'+encodeURIComponent(f.id)+'/download'}>
                    Download
                  </a>
                </td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
