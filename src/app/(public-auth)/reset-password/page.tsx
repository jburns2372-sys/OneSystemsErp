'use client';

import { useState } from 'react';
import { executePasswordReset } from '@/app/actions/recovery';

// Note: In Next.js App Router, we shouldn't use useSearchParams from 'next/navigation' 
// unless we wrap the component in a Suspense boundary if statically rendering.
// Since this page handles a token, it will be dynamic.
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage('Missing recovery token.');
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    const res = await executePasswordReset(token, password);
    if (res.success) {
      setSuccess(true);
      setMessage('Password successfully reset. You can now log in.');
    } else {
      setMessage(res.error || 'Password reset failed.');
    }
    setLoading(false);
  };

  if (!token) {
    return <div className="p-4 text-red-600">Invalid link. No token provided.</div>;
  }

  if (success) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-green-700">Success</h1>
        <p>{message}</p>
        <a href="/login" className="mt-4 inline-block text-blue-600 underline">Go to Login</a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      {message && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded">
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input 
            type="password" 
            required 
            className="w-full border p-2 rounded" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input 
            type="password" 
            required 
            className="w-full border p-2 rounded" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
          />
        </div>
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
