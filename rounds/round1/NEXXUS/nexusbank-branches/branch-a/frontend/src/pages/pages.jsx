import { useState } from 'react'
import Layout, { Card, Btn } from '../components/Layout'

export function Transfer({ user, setUser }) {
  const [form, setForm] = useState({ to_account: '', amount: '', note: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setMsg(''); setError('')
    const res = await fetch('/api/transfer', { method: 'POST', headers: {'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok) { setMsg(data.message); setForm({to_account:'',amount:'',note:''}) }
    else setError(data.error)
  }

  return (
    <Layout user={user} setUser={setUser} title="Fund Transfer">
      <Card style={{ maxWidth: '550px' }}>
        <Card style={{ background: '#fffbeb', borderColor: '#f6ad55', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.82rem', color: '#92400e' }}>⚠️ <strong>CSRF Vuln:</strong> No CSRF token — any website can trigger this transfer while you're logged in!</div>
        </Card>
        {msg && <div style={{ background: '#f0fff4', color: '#276749', borderLeft: '3px solid #38a169', padding: '0.75rem', borderRadius: '5px', marginBottom: '1rem', fontSize: '0.85rem' }}>{msg}</div>}
        {error && <div style={{ background: '#fff5f5', color: '#c53030', borderLeft: '3px solid #e53e3e', padding: '0.75rem', borderRadius: '5px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
        <form onSubmit={submit}>
          {[['To Account','to_account','e.g. ACC003'],['Amount','amount','Enter amount in ₹'],['Note','note','Optional note']].map(([label,name,ph])=>(
            <div key={name} style={{ marginBottom: '1rem' }}>
              <label style={{ display:'block', fontSize:'0.78rem', fontWeight:500, color:'#718096', marginBottom:'0.4rem' }}>{label}</label>
              <input value={form[name]} onChange={e=>setForm({...form,[name]:e.target.value})} placeholder={ph} type={name==='amount'?'number':'text'} style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'6px', padding:'0.65rem 0.9rem', fontSize:'0.9rem', outline:'none' }} />
            </div>
          ))}
          <Btn type="submit" style={{ width: '100%' }}>Transfer →</Btn>
        </form>
      </Card>
    </Layout>
  )
}

export function Feedback({ user }) {
  const [message, setMessage] = useState('')
  const [feedbacks, setFeedbacks] = useState([])
  const [msg, setMsg] = useState('')

  const load = () => fetch('/api/feedback', { credentials:'include' }).then(r=>r.json()).then(setFeedbacks).catch(()=>{})

  const submit = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/feedback', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ message }) })
    if (res.ok) { setMsg('Feedback submitted!'); setMessage(''); load() }
  }

  useState(() => { load() }, [])

  return (
    <Layout user={user} title="Customer Feedback">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
        <Card>
          <h3 style={{ fontSize:'0.9rem', fontWeight:600, marginBottom:'0.75rem', color:'#1a3c6e' }}>Submit Feedback</h3>
          <Card style={{ background:'#fffbeb', borderColor:'#f6ad55', padding:'0.75rem', marginBottom:'1rem' }}>
            <div style={{ fontSize:'0.78rem', color:'#92400e' }}>⚠️ <strong>Stored XSS:</strong> Try: <code style={{background:'#fff',padding:'0.1rem 0.3rem',borderRadius:'3px'}}>&lt;script&gt;alert('XSS')&lt;/script&gt;</code></div>
          </Card>
          {msg && <div style={{ background:'#f0fff4', color:'#276749', padding:'0.6rem', borderRadius:'4px', fontSize:'0.82rem', marginBottom:'0.75rem' }}>{msg}</div>}
          <form onSubmit={submit}>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write your feedback... (HTML/scripts allowed!)" rows={4} style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'6px', padding:'0.65rem', fontSize:'0.88rem', outline:'none', resize:'vertical', marginBottom:'0.75rem' }} />
            <Btn type="submit" style={{ width:'100%' }}>Submit Feedback</Btn>
          </form>
        </Card>
        <Card>
          <h3 style={{ fontSize:'0.9rem', fontWeight:600, marginBottom:'0.75rem', color:'#1a3c6e' }}>All Feedback</h3>
          <button onClick={load} style={{ background:'#f0f4f8', border:'1px solid #e2e8f0', borderRadius:'5px', padding:'0.4rem 0.9rem', fontSize:'0.78rem', cursor:'pointer', marginBottom:'0.75rem' }}>Refresh</button>
          {feedbacks.map(f => (
            <div key={f.id} style={{ padding:'0.75rem', background:'#f7fafc', borderRadius:'6px', marginBottom:'0.5rem' }}>
              <div style={{ fontSize:'0.72rem', color:'#718096', marginBottom:'0.3rem' }}>By {f.username} · {f.timestamp?.slice(0,16)}</div>
              {/* VULN: Stored XSS — dangerouslySetInnerHTML */}
              <div style={{ fontSize:'0.85rem' }} dangerouslySetInnerHTML={{ __html: f.message }} />
            </div>
          ))}
        </Card>
      </div>
    </Layout>
  )
}

export function Statement({ user }) {
  const [file, setFile] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const download = async () => {
    setError(''); setContent('')
    const res = await fetch(`/api/statement?file=${encodeURIComponent(file)}`, { credentials:'include' })
    const data = await res.json()
    if (res.ok) setContent(data.content)
    else setError(data.error)
  }

  return (
    <Layout user={user} title="Account Statement">
      <Card style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize:'0.9rem', fontWeight:600, marginBottom:'0.75rem' }}>Download Statement</h3>
        <Card style={{ background:'#fffbeb', borderColor:'#f6ad55', padding:'0.75rem', marginBottom:'1rem' }}>
          <div style={{ fontSize:'0.78rem', color:'#92400e' }}>⚠️ <strong>Directory Traversal:</strong> Try: <code style={{background:'#fff',padding:'0.1rem 0.3rem',borderRadius:'3px'}}>../../secret_config.txt</code></div>
        </Card>
        <div style={{ marginBottom:'0.75rem' }}>
          <label style={{ display:'block', fontSize:'0.78rem', fontWeight:500, color:'#718096', marginBottom:'0.4rem' }}>Statement File</label>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <input value={file} onChange={e=>setFile(e.target.value)} placeholder="e.g. ACC002_statement.txt" style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:'6px', padding:'0.65rem 0.9rem', fontSize:'0.88rem', outline:'none' }} />
            <Btn onClick={download}>Download</Btn>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1rem' }}>
          {['ACC002_statement.txt','ACC003_statement.txt','../../secret_config.txt','../../../etc/passwd'].map(f=>(
            <button key={f} onClick={()=>setFile(f)} style={{ background:'#f0f4f8', border:'1px solid #e2e8f0', borderRadius:'4px', padding:'0.3rem 0.6rem', fontSize:'0.72rem', cursor:'pointer', color: f.includes('..')? '#e53e3e':'#1a3c6e' }}>{f}</button>
          ))}
        </div>
        {error && <div style={{ background:'#fff5f5', color:'#c53030', padding:'0.75rem', borderRadius:'5px', fontSize:'0.83rem', marginBottom:'0.75rem' }}>{error}</div>}
        {content && <pre style={{ background:'#1a202c', color:'#68d391', padding:'1rem', borderRadius:'6px', fontSize:'0.82rem', overflow:'auto', whiteSpace:'pre-wrap' }}>{content}</pre>}
      </Card>
    </Layout>
  )
}

export function AllAccounts({ user }) {
  const [accounts, setAccounts] = useState([])
  const [loaded, setLoaded] = useState(false)

  const load = async () => {
    const res = await fetch('/api/all-accounts', { credentials:'include' })
    const data = await res.json()
    setAccounts(data); setLoaded(true)
  }

  return (
    <Layout user={user} title="All Accounts (API)">
      <Card>
        <Card style={{ background:'#fff5f5', borderColor:'#fc8181', padding:'0.85rem', marginBottom:'1rem' }}>
          <div style={{ fontSize:'0.82rem', color:'#c53030' }}>🚨 <strong>Sensitive Data Exposure:</strong> <code>/api/all-accounts</code> returns ALL user data including passwords, PAN numbers — no auth check!</div>
        </Card>
        <button onClick={load} style={{ background:'#1a3c6e', color:'#fff', border:'none', borderRadius:'6px', padding:'0.65rem 1.5rem', fontWeight:600, cursor:'pointer', marginBottom:'1rem' }}>
          {loaded ? 'Refresh Data' : 'Fetch All Accounts →'}
        </button>
        {loaded && (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{['ID','Account','Username','Name','Email','Balance','Phone','PAN','Password Hash'].map(h=><th key={h} style={{ textAlign:'left', fontSize:'0.7rem', fontWeight:600, textTransform:'uppercase', color:'#718096', padding:'0.5rem 0.75rem', borderBottom:'2px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {accounts.map((a,i)=>(
                  <tr key={a.id} style={{ background:i%2===0?'#fff':'#f7fafc' }}>
                    <td style={{ padding:'0.6rem 0.75rem', fontSize:'0.8rem' }}>{a.id}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontSize:'0.8rem', fontFamily:'monospace', color:'#1a3c6e' }}>{a.account_no}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontSize:'0.8rem' }}>{a.username}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontSize:'0.8rem', fontWeight:500 }}>{a.full_name}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontSize:'0.8rem' }}>{a.email}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontSize:'0.8rem', fontWeight:700, color:'#38a169' }}>₹{Number(a.balance||0).toLocaleString('en-IN')}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontSize:'0.8rem' }}>{a.phone}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontSize:'0.78rem', fontFamily:'monospace', color:'#e53e3e' }}>{a.pan}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontSize:'0.72rem', fontFamily:'monospace', color:'#718096' }}>{a.password?.slice(0,16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  )
}
