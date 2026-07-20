'use client';

import { useState } from 'react';
import { requestPasswordReset } from '@/app/actions/recovery';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    // We should ideally pass real IP and User-Agent from a server component,
    // but Next.js actions don't expose req in client by default without headers().
    const res = await requestPasswordReset(email);
    if ('message' in res && typeof res.message === 'string') {
      setMessage(res.message);
    } else if ('code' in res && typeof res.code === 'string') {
      setMessage(res.code);
    } else {
      setMessage('An unexpected error occurred.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
        {message && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full border p-2 rounded" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Request Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
