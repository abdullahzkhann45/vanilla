'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackPage() {
  const router = useRouter();
  const [num, setNum] = useState('');
  const [email, setEmail] = useState('');
  return (
    <section className="container" style={{ padding: '40px 0', maxWidth: 480 }}>
      <h1 className="h-serif" style={{ fontSize: 32, margin: 0 }}>Track your order</h1>
      <p style={{ color: '#666' }}>Enter your order number and the email you checked out with.</p>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/order/${num.trim()}?email=${encodeURIComponent(email.trim())}`);
        }}
      >
        <div className="field"><label>Order number</label><input required value={num} onChange={(e) => setNum(e.target.value)} placeholder="VNL-XXXXXXXX" /></div>
        <div className="field"><label>Email</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <button type="submit" style={{ padding: 14, background: '#111', color: '#fff', border: 0, fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase' }}>Look up</button>
      </form>
    </section>
  );
}
