"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiFileText, FiLock, FiDownload, FiEdit2, FiTrash2, FiMaximize } from "react-icons/fi";
import { deleteAccomplishmentFileAction } from "@/app/actions/accomplishmentFileActions";

export default function ProgressBillingsClient({ projects }: { projects: any[] }) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }} onClick={() => activeMenuId && setActiveMenuId(null)}>
      
      <header style={{ marginBottom: '40px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '2rem' }}>Progress Billings</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>View and manage your saved Accomplishment Reports / Progress Billings.</p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: '30px'
      }}>
        {projects.map((project) => {
          return (
            <div key={project.id} style={{
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--glass-border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'var(--accent-color)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 240, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
            }}>
              <div style={{ padding: '25px', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', lineHeight: '1.4', paddingRight: '10px' }}>
                    {project.name}
                  </h3>
                  <span style={{ 
                    background: 'rgba(0, 240, 255, 0.1)', 
                    color: 'var(--accent-color)', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}>
                    {project.status}
                  </span>
                </div>
                
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  background: 'var(--glass-panel)', 
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Contract Amount</span>
                    <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
                      {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(project.contractAmount)}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '25px' }}>
                  <div className="flex justify-between items-center mb-3">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 'bold', margin: 0 }}>SAVED BILLINGS / ACCOMPLISHMENTS</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {project.projectAccomplishmentFiles?.map((file: any) => (
                      <div key={file.id} className="flex flex-col p-3 bg-[var(--bg-tertiary)] border border-gray-600/30 rounded-lg group">
                        <div className="flex items-center gap-3">
                           {file.isLockedOriginal ? <FiLock size={16} className="text-blue-500 shrink-0"/> : <FiFileText size={16} className="text-gray-400 shrink-0" />}
                           <div className="flex-1 min-w-0">
                             <p className="text-sm text-white m-0 leading-tight truncate">{file.fileName}</p>
                             <p className="text-xs text-gray-400 m-0 leading-tight mt-1">
                               Saved: {new Date(file.createdAt).toLocaleDateString()} | {(file.fileSize / 1024).toFixed(1)} KB
                             </p>
                           </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center gap-2 justify-end">
                           <Link 
                             href={`/accomplishments/view/${file.id}`}
                             className="px-3 py-1.5 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded flex items-center gap-2 transition"
                           >
                             <FiMaximize size={12} /> Open Grid
                           </Link>
                           <a 
                             href={file.originalFilePath}
                             download
                             className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded flex items-center gap-2 transition"
                           >
                             <FiDownload size={12} /> Download Excel
                           </a>
                           <button 
                             onClick={async () => {
                                if(!confirm("Delete this billing file?")) return;
                                await deleteAccomplishmentFileAction(file.id);
                             }}
                             className="px-2 py-1.5 text-xs hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition ml-auto"
                             title="Delete"
                           >
                             <FiTrash2 size={14} />
                           </button>
                        </div>
                      </div>
                    ))}
                    {(!project.projectAccomplishmentFiles || project.projectAccomplishmentFiles.length === 0) && (
                      <div className="text-xs text-gray-500 italic p-3 text-center border border-dashed border-gray-600/30 rounded-lg">No billings saved yet.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
        {projects.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--text-muted)', borderRadius: '16px' }}>
            No active projects found.
          </div>
        )}
      </div>
    </div>
  );
}
