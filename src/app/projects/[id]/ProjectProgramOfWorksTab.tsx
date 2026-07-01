'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DocumentEditor } from '@onlyoffice/document-editor-react';

interface ProjectProgramOfWorksTabProps {
  projectId: string;
  projectName?: string;
  projectLocation?: string;
  awardedBoqItems?: any[];
  letterheadLine1?: string;
  letterheadLine2?: string;
  letterheadLine3?: string;
  letterheadLogo?: string;
  boqRawHeaders?: string[];
}

export default function ProjectProgramOfWorksTab({
  projectId,
  projectName,
}: ProjectProgramOfWorksTabProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [onlyofficeConfig, setOnlyofficeConfig] = useState<any>(null);
  const [documentServerUrl, setDocumentServerUrl] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [extractionStatus, setExtractionStatus] = useState<string>('PENDING');
  const [commitStatus, setCommitStatus] = useState<string>('PENDING');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/projects/${projectId}/pow-boq/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadId(data.uploadId);
        fetchOnlyofficeConfig(data.uploadId);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const fetchOnlyofficeConfig = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/pow-boq/uploads/${id}/onlyoffice-config`);
      const data = await res.json();
      if (res.ok) {
        setOnlyofficeConfig(data.config);
        setDocumentServerUrl(data.documentServerUrl);
        if (data.token) setToken(data.token);
      } else {
        alert(data.error || 'Failed to load ONLYOFFICE config');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load ONLYOFFICE config');
    }
  };

  const extractData = async () => {
    if (!uploadId) return;
    setIsExtracting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/pow-boq/uploads/${uploadId}/extract`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setExtractionStatus('COMPLETED');
        alert('BOQ data extracted successfully! It is now available for review and commit.');
      } else {
        setExtractionStatus('FAILED');
        alert(data.error || 'Extraction failed');
      }
    } catch (err) {
      console.error(err);
      setExtractionStatus('FAILED');
      alert('Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const commitData = async () => {
    if (!uploadId || extractionStatus !== 'COMPLETED') return;
    setIsCommitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/pow-boq/uploads/${uploadId}/commit`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setCommitStatus('COMMITTED');
        alert(`Version ${data.version} successfully committed to the ERP database for billing and procurement!`);
      } else {
        alert(data.error || 'Commit failed. Make sure extraction has no errors.');
      }
    } catch (err) {
      console.error(err);
      alert('Commit failed');
    } finally {
      setIsCommitting(false);
    }
  };

  const onDocumentReady = () => {
    console.log("Document is loaded");
  };

  const onLoadComponentError = (errorCode: any, errorDescription: any) => {
    switch(errorCode) {
        case -1: // Unknown error
        case -2: // Error load DocsAPI from documentServerUrl
        case -3: // DocsAPI load timeout
            console.warn("ONLYOFFICE Load Warning (caught):", errorDescription);
            break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden p-6 gap-6">
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            POW & BOQ Upload Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload original Excel templates. View them natively via ONLYOFFICE and extract data seamlessly.
          </p>
        </div>
        
        {uploadId && (
          <div className="flex items-center gap-4">
             <button
              onClick={extractData}
              disabled={isExtracting || commitStatus === 'COMMITTED'}
              className={`px-5 py-2.5 rounded-lg font-semibold shadow-lg transition-all ${
                isExtracting ? 'bg-slate-600 text-slate-400 cursor-not-allowed' :
                extractionStatus === 'COMPLETED' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' :
                'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105'
              }`}
            >
              {isExtracting ? 'Extracting...' : extractionStatus === 'COMPLETED' ? 'Extracted successfully' : 'Extract BOQ Data'}
            </button>
            {extractionStatus === 'COMPLETED' && (
              <button
                onClick={commitData}
                disabled={isCommitting || commitStatus === 'COMMITTED'}
                className={`px-5 py-2.5 rounded-lg font-semibold shadow-lg transition-all ${
                  isCommitting ? 'bg-slate-600 text-slate-400 cursor-not-allowed' :
                  commitStatus === 'COMMITTED' ? 'bg-purple-600 text-white cursor-not-allowed' :
                  'bg-orange-500 hover:bg-orange-400 text-white hover:scale-105'
                }`}
              >
                {isCommitting ? 'Committing...' : commitStatus === 'COMMITTED' ? 'Committed to ERP' : 'Commit to ERP'}
              </button>
            )}
            <button
              onClick={() => { setUploadId(null); setOnlyofficeConfig(null); setExtractionStatus('PENDING'); setCommitStatus('PENDING'); }}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              Upload New
            </button>
          </div>
        )}
      </div>

      {!uploadId ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50 p-12 transition-all hover:bg-slate-800 hover:border-blue-500">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Upload Excel BOQ Template</h3>
          <p className="text-slate-400 mb-8 max-w-md text-center text-sm">
            Please upload the `.xlsx` file containing the Program of Works and Bill of Quantities. The original file will be preserved and accessible natively via ONLYOFFICE.
          </p>
          <input
            type="file"
            accept=".xlsx"
            ref={fileInputRef}
            onChange={onFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`px-8 py-3 rounded-lg font-bold shadow-lg transition-all ${
              uploading ? 'bg-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 hover:shadow-blue-500/25'
            }`}
          >
            {uploading ? 'Uploading...' : 'Select .xlsx File'}
          </button>
        </div>
      ) : (
        <div className="flex-1 w-full rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-white">
          {onlyofficeConfig ? (
             <DocumentEditor
                id="onlyoffice-editor"
                documentServerUrl={documentServerUrl}
                config={onlyofficeConfig}
                events_onDocumentReady={onDocumentReady}
                onLoadComponentError={onLoadComponentError}
                height="100%"
            />
          ) : (
             <div className="flex h-full items-center justify-center bg-slate-800 text-white">
                <p>Loading Editor...</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
