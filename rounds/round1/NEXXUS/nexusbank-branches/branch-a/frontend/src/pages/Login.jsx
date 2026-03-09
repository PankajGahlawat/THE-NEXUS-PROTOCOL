import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login({ setUser }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const login = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) { setUser(data.user); navigate('/dashboard') }
      else setError(data.error || 'Login failed')
    } catch { setError('Connection error') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a3c6e 0%, #2a5298 50%, #1a3c6e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: '900px', width: '90%', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
        {/* LEFT */}
        <div style={{ background: 'linear-gradient(160deg,#1a3c6e,#2a5298)', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff' }}>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c8a84b' }}>NexusBank</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>Branch A — Andheri West</div>
          </div>
          <div>
            {[['🏦','Savings & Current Accounts','Competitive interest rates'],['💸','Instant Fund Transfer','24/7 NEFT/RTGS/IMPS'],['📊','Investment Services','Grow your wealth smartly'],['🔒','Secure Banking','Your money, safely managed']].map(([icon,title,desc])=>(
              <div key={title} style={{ display:'flex',gap:'0.75rem',marginBottom:'1.25rem',alignItems:'flex-start' }}>
                <span style={{fontSize:'1.2rem'}}>{icon}</span>
                <div><div style={{fontWeight:600,fontSize:'0.88rem'}}>{title}</div><div style={{fontSize:'0.75rem',opacity:0.6,marginTop:'0.15rem'}}>{desc}</div></div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.72rem', opacity: 0.4 }}>© 2025 NexusBank Ltd. All rights reserved.</div>
        </div>

        {/* RIGHT */}
        <div style={{ padding: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a3c6e', marginBottom: '0.5rem' }}>Welcome Back</h2>
          <p style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '2rem' }}>Sign in to your NexusBank account</p>

          {error && <div style={{ background: '#fff5f5', color: '#c53030', borderLeft: '3px solid #e53e3e', padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.83rem', marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={login}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: '#718096', marginBottom: '0.4rem' }}>Username</label>
              <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="Enter username" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.7rem 0.9rem', fontSize: '0.9rem', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: '#718096', marginBottom: '0.4rem' }}>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Enter password" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.7rem 0.9rem', fontSize: '0.9rem', outline: 'none' }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', background: '#1a3c6e', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.8rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.85rem', marginTop: '1.5rem', fontSize: '0.78rem', color: '#718096' }}>
            <strong style={{ color: '#1a3c6e' }}>Demo Accounts:</strong><br/>
            alice / password &nbsp;·&nbsp; bob / bob123 &nbsp;·&nbsp; charlie / charlie
          </div>
        </div>
      </div>
    </div>
  )
}
