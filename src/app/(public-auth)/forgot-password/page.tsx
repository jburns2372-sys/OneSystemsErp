'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/actions/recovery';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);
    
    const res = await requestPasswordReset(email);
    if ('message' in res && typeof res.message === 'string') {
      setMessage(res.message);
      setIsError(!res.success);
    } else if ('code' in res && typeof res.code === 'string') {
      setMessage(res.code);
      setIsError(true);
    } else {
      setMessage('An unexpected error occurred.');
      setIsError(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: '#0f172a' }}>
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2 text-slate-900">Forgot Password</h1>
        <p className="text-sm text-slate-600 mb-4">
          Enter your registered email address to request a single-use password reset link.
        </p>
        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${isError ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="recovery-email" className="block text-sm font-medium mb-1 text-slate-700">Email</label>
            <input 
              id="recovery-email"
              type="email" 
              required 
              className="w-full border p-2 rounded text-slate-900" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="user@onesystemserp.com"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50 font-medium"
          >
            {loading ? 'Sending...' : 'Request Reset Link'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
