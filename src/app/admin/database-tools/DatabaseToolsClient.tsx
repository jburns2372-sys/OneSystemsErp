'use client';

import React, { useState } from 'react';
import { Database, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DatabaseToolsClient() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    setShowSeedModal(false);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Seed data generated successfully!');
      } else {
        toast.error(data.error || 'Failed to generate seed data.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred while seeding.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    setShowClearModal(false);
    try {
      const res = await fetch('/api/admin/clear-seed', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Seed data cleared successfully!');
      } else {
        toast.error(data.error || 'Failed to clear seed data.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred while clearing seed data.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-200">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-500" />
          Database Tools
        </h1>
        <p className="text-gray-400 mt-2">Manage system seed data for testing, simulation, and training.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seed Data Card */}
        <div className="bg-[#1e2330] rounded-xl border border-gray-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Generate Seed Data</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Populate the database with realistic demo data. This includes Workers, Suppliers, Subcontractors, and Job Order Contractors. All generated data will be marked as seed data and can be easily removed.
            </p>
          </div>
          <button
            onClick={() => setShowSeedModal(true)}
            disabled={isSeeding || isClearing}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSeeding ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
            ) : (
              <><Database className="w-5 h-5" /> Generate Master Data</>
            )}
          </button>
        </div>

        {/* Clear Seed Data Card */}
        <div className="bg-[#1e2330] rounded-xl border border-red-900/30 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-red-400">Clear Seed Data</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Safely remove all seeded data from the database. This action ONLY deletes records marked with the <code className="bg-gray-800 px-1 py-0.5 rounded text-xs text-blue-300">isSeedData = true</code> flag. Production data will not be affected.
            </p>
          </div>
          <button
            onClick={() => setShowClearModal(true)}
            disabled={isSeeding || isClearing}
            className="w-full py-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Clearing...</>
            ) : (
              <><Trash2 className="w-5 h-5" /> Clear All Seed Data</>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      {showSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e2330] border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-blue-500" />
              Confirm Seed Generation
            </h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Are you sure you want to generate seed data? This will create approximately 50 workers, 40 suppliers, and 35 subcontractors in your database.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowSeedModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSeed}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Yes, Generate Data
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e2330] border border-red-900/50 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Confirm Data Deletion
            </h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Are you sure you want to delete all seed data? This action will permanently remove all generated demo records. Production data will remain safe.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleClear}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                Yes, Clear Seed Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
