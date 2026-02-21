'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        // Get redirect URL from query params
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/';
        window.location.href = redirect;
      } else {
        setError('Incorrect password');
        setPassword('');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/potomac-logo.png" alt="Potomac" className="h-10 mx-auto mb-4 object-contain" />
          <h1 className="text-[#FEC00F] text-2xl font-bold tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            PRESENTER
          </h1>
          <p className="text-gray-500 text-xs tracking-widest mt-1">BY POTOMAC SUITE</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#212121] border-2 border-[#FEC00F]/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#FEC00F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Enter password to continue</p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest placeholder-gray-600 focus:outline-none focus:border-[#FEC00F] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-[#FEC00F] text-[#212121] font-bold py-3 rounded-xl hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#212121] border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Enter'
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          Built to Conquer Risk® &middot; Potomac Fund Management
        </p>
      </div>
    </div>
  );
}
