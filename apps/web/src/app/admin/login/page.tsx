'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '@/lib/admin-client';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/admin/auth/login', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) throw new Error('Invalid credentials');
      const data = await r.json();
      setToken(data.token);
      router.replace('/admin/orders');
    } catch (e: any) {
      setErr(e.message);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ background: '#f5f3ed', minHeight: '100vh' }}>
      <div className="admin-login">
        <h1>Admin sign-in</h1>
        <form className="form" onSubmit={submit}>
          <div className="field"><label>Email</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label>Password</label><input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {err && <div style={{ color: '#a33', fontSize: 13 }}>{err}</div>}
          <button type="submit" disabled={busy} style={{ padding: 12, background: '#111', color: '#fff', border: 0 }}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
