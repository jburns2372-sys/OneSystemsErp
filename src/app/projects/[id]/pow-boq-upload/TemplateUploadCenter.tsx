'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function TemplateUploadCenter({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<'preview' | 'data'>('preview');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'extracting' | 'validating' | 'ready'>('idle');
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<{ sections: any[], items: any[] } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!uploadFile) return;
    try {
      setUploadStatus('uploading');
      
      // 1. Upload Original
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      const uploadRes = await fetch(`/api/projects/${projectId}/pow-boq/upload-original`, {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
      
      const newUploadId = uploadData.uploadId;
      setUploadId(newUploadId);
      setOriginalUrl(uploadData.file.storagePath);
      
      // 2. Extract Data
      setUploadStatus('extracting');
      const extractRes = await fetch(`/api/projects/${projectId}/pow-boq/${newUploadId}/extract`, { method: 'POST' });
      if (!extractRes.ok) throw new Error('Extraction failed');
      
      // 3. Fetch Extracted Data
      const dataRes = await fetch(`/api/projects/${projectId}/pow-boq/${newUploadId}/extracted-data`);
      const dataJson = await dataRes.json();
      if (dataRes.ok) {
        setExtractedData(dataJson);
      }
      
      setUploadStatus('ready');
      setActiveTab('data'); // Switch to data tab to show extraction success
    } catch (err: any) {
      alert(err.message);
      setUploadStatus('idle');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Standard Template Upload Center</h2>
          <p className="text-gray-500 text-sm mt-1">
            Upload the official Master POW & BOQ Template. The system will preserve the original layout and extract structured ERP data separately.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <input 
            type="file" 
            accept=".xlsx" 
            onChange={handleFileChange} 
            className="hidden" 
            ref={fileInputRef} 
          />
          <button 
            className="btn-secondary py-2 px-4 border rounded shadow-sm bg-white hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadFile ? uploadFile.name : 'Select .xlsx Template'}
          </button>
          
          <button 
            className="btn-primary py-2 px-6 rounded shadow-md text-white font-semibold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
            onClick={handleUploadAndProcess}
            disabled={!uploadFile || uploadStatus !== 'idle'}
          >
            {uploadStatus === 'idle' ? 'Upload & Process' : `Processing (${uploadStatus})...`}
          </button>
        </div>
      </div>

      {uploadStatus === 'ready' && (
        <div className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button 
              className={`flex-1 py-4 font-bold text-center border-b-2 transition-colors ${activeTab === 'preview' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              onClick={() => setActiveTab('preview')}
            >
              📄 Official Excel Preview
            </button>
            <button 
              className={`flex-1 py-4 font-bold text-center border-b-2 transition-colors ${activeTab === 'data' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              onClick={() => setActiveTab('data')}
            >
              📊 Extracted ERP BOQ Data
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'preview' && (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <div className="text-6xl mb-4">📗</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Original Document Preserved</h3>
                <p className="text-gray-500 max-w-md text-center mb-6">
                  The original Excel formatting, logos, and print layouts have been securely saved. 
                  (Document Server integration for embedded viewing is currently pending environment setup).
                </p>
                <a 
                  href={originalUrl || '#'} 
                  download 
                  className="px-6 py-3 bg-white border border-gray-300 rounded-md shadow-sm font-semibold hover:bg-gray-50"
                >
                  📥 Download Original File
                </a>
              </div>
            )}

            {activeTab === 'data' && extractedData && (
              <div className="overflow-x-auto">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Structured Business Data</h3>
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                    Extraction Successful ({extractedData.items.length} items)
                  </span>
                </div>
                <table className="min-w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="border p-2">Row</th>
                      <th className="border p-2">Item No.</th>
                      <th className="border p-2">Description</th>
                      <th className="border p-2">Unit</th>
                      <th className="border p-2 text-right">Qty</th>
                      <th className="border p-2 text-right">Direct Cost</th>
                      <th className="border p-2 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.items.slice(0, 100).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 border-b">
                        <td className="border p-2 text-gray-400">{item.sourceRowNumber}</td>
                        <td className="border p-2 font-semibold">{item.itemNumber}</td>
                        <td className="border p-2">{item.description}</td>
                        <td className="border p-2 text-center">{item.unit}</td>
                        <td className="border p-2 text-right">{item.quantity}</td>
                        <td className="border p-2 text-right">{item.totalDirectCost?.toLocaleString()}</td>
                        <td className="border p-2 text-right font-bold text-emerald-700">{item.amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {extractedData.items.length > 100 && (
                  <div className="text-center py-4 text-gray-500 text-sm italic border-t">
                    Showing first 100 items for preview...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
