import React from 'react';
import { Worker } from '@prisma/client';

export default function WorkerPaymentProfileCard({ worker }: { worker: Worker }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Payment & Routing Profile</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
      </div>
      <div className="p-6">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Payroll Category</dt>
            <dd className="mt-1 text-sm text-gray-900 font-medium">
              {worker.payrollCategory || 'Not Set'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Allowed Payment Method</dt>
            <dd className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${worker.allowedPaymentMethod === 'GCash Only' ? 'bg-blue-100 text-blue-800' : worker.allowedPaymentMethod === 'Bank Transfer Only' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {worker.allowedPaymentMethod || 'Manual Hold'}
              </span>
            </dd>
          </div>

          <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Bank Information (InstaPay / PESONet)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Bank Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{worker.bankName || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Account Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{worker.bankAccountNumber || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Verification Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {worker.bankVerificationStatus === 'Verified' ? (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Verified
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">Unverified</span>
                  )}
                </dd>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">GCash Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500">Mobile Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{worker.gcashNumber || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Account Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{worker.gcashAccountName || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Verification Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {worker.gcashVerificationStatus === 'Verified' ? (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Verified
                    </span>
                  ) : (
                    <span className="text-gray-500 font-medium">Pending</span>
                  )}
                </dd>
              </div>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
