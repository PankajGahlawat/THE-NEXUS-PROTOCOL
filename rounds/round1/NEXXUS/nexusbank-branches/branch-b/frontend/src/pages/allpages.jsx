import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout, { Card, Btn, VulnBox } from '../components/Layout'

// ── LOGIN ──────────────────────────────────────────
export function Login({ setUser }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const login = async (e) => {
    e.preventDefault(); setError('')
    const res = await fetch('/api/login', { method: 'POST', headers: {'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok) { setUser(data.user); navigate('/dashboard') }
    else setError(data.error || 'Login failed')
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0d3b8c,#1a4fa0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', maxWidth:'900px', width:'90%', background:'#fff', borderRadius:'16px', overflow:'hidden', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background:'linear-gradient(160deg,#0d3b8c,#1a4fa0)', padding:'3rem', color:'#fff', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:'1.8rem', fontWeight:800, color:'#e8a020' }}>NexusBank</div>
            <div style={{ fontSize:'0.8rem', opacity:0.6, marginTop:'0.25rem' }}>Branch B — Bandra</div>
          </div>
          <div>
            {[['🔐','JWT Authentication','Secure token-based login'],['📊','Credit Scoring','Real-time credit assessment'],['🏦','Loan Services','Quick loan approvals'],['🔍','Account Search','Find accounts instantly']].map(([i,t,d])=>(
              <div key={t} style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem' }}>
                <span style={{fontSize:'1.2rem'}}>{i}</span>
                <div><div style={{fontWeight:600,fontSize:'0.88rem'}}>{t}</div><div style={{fontSize:'0.75rem',opacity:0.6}}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:'0.72rem', opacity:0.4 }}>© 2025 NexusBank Ltd.</div>
        </div>
        <div style={{ padding:'3rem' }}>
          <h2 style={{ fontSize:'1.5rem', fontWeight:700, color:'#0d3b8c', marginBottom:'0.5rem' }}>Welcome Back</h2>
          <p style={{ color:'#718096', fontSize:'0.85rem', marginBottom:'2rem' }}>Branch B — Bandra Internet Banking</p>
          {error && <div style={{ background:'#fff5f5', color:'#c53030', borderLeft:'3px solid #e53e3e', padding:'0.75rem 1rem', borderRadius:'4px', fontSize:'0.83rem', marginBottom:'1rem' }}>{error}</div>}
          <form onSubmit={login}>
            {[['Username','username','text'],['Password','password','password']].map(([l,n,t])=>(
              <div key={n} style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:'0.78rem', fontWeight:500, color:'#718096', marginBottom:'0.4rem' }}>{l}</label>
                <input type={t} value={form[n]} onChange={e=>setForm({...form,[n]:e.target.value})} placeholder={`Enter ${l.toLowerCase()}`} style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'6px', padding:'0.7rem 0.9rem', fontSize:'0.9rem', outline:'none' }} />
              </div>
            ))}
            <button type="submit" style={{ width:'100%', background:'#0d3b8c', color:'#fff', border:'none', borderRadius:'6px', padding:'0.8rem', fontWeight:700, fontSize:'0.95rem', cursor:'pointer', marginTop:'0.5rem' }}>Sign In →</button>
          </form>
          <div style={{ background:'#f7fafc', border:'1px solid #e2e8f0', borderRadius:'6px', padding:'0.85rem', marginTop:'1.5rem', fontSize:'0.78rem', color:'#718096' }}>
            <strong style={{color:'#0d3b8c'}}>Demo:</strong> priya / priya123 &nbsp;·&nbsp; rohan / rohan456
          </div>
        </div>
      </div>
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────
export function Dashboard({ user, setUser }) {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    fetch('/api/me', { credentials:'include' }).then(r=>r.json()).then(setInfo)
  }, [])

  return (
    <Layout user={user} setUser={setUser} title="Dashboard">
      <VulnBox>
        💡 <strong>JWT Hint:</strong> Your token is in cookies! Open DevTools → Application → Cookies → <code>token_b</code>. The JWT secret is <code>secret</code> — try forging a token with <code>role: "admin"</code>!
      </VulnBox>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[['Account', info?.account_no || '—', '#0d3b8c'],['Balance', `₹${Number(info?.balance||0).toLocaleString('en-IN')}`, '#38a169'],['Role', info?.role || '—', info?.role==='admin'?'#e53e3e':'#718096']].map(([l,v,c])=>(
          <Card key={l} style={{textAlign:'center'}}>
            <div style={{fontSize:'0.75rem',color:'#718096',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.5rem'}}>{l}</div>
            <div style={{fontSize:'1.3rem',fontWeight:700,color:c}}>{v}</div>
          </Card>
        ))}
      </div>
      <Card>
        <h3 style={{fontSize:'0.85rem',fontWeight:600,color:'#718096',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'1rem'}}>Quick Actions</h3>
        <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
          <Link to={`/transactions/${user.account_no}`}><Btn>💳 My Transactions</Btn></Link>
          <Link to="/profile"><Btn variant="outline">✏️ Edit Profile</Btn></Link>
          <Link to="/search"><Btn variant="outline">🔍 Search Accounts</Btn></Link>
          <Link to="/docs"><Btn variant="outline">📄 Documents</Btn></Link>
          <Link to="/admin"><Btn variant="outline">⚙️ Admin Panel</Btn></Link>
        </div>
      </Card>
    </Layout>
  )
}

// ── TRANSACTIONS (IDOR) ────────────────────────────
export function Transactions({ user }) {
  const { acc } = useParams()
  const [txns, setTxns] = useState([])
  const [customAcc, setCustomAcc] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`/api/transactions/${acc}`, { credentials:'include' }).then(r=>r.json()).then(setTxns)
  }, [acc])

  return (
    <Layout user={user} title="Transaction History">
      <VulnBox>⚠️ <strong>IDOR:</strong> Change account in URL — <code>/transactions/BAC001</code> shows admin transactions!</VulnBox>
      <Card>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>
          {['BAC001','BAC002','BAC003','BAC004','BAC005'].map(a=>(
            <button key={a} onClick={()=>navigate(`/transactions/${a}`)} style={{background:a===acc?'#0d3b8c':'#fff',color:a===acc?'#fff':'#0d3b8c',border:'1px solid #0d3b8c',borderRadius:'5px',padding:'0.35rem 0.75rem',fontSize:'0.78rem',cursor:'pointer'}}>{a}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
          <input value={customAcc} onChange={e=>setCustomAcc(e.target.value)} placeholder="Custom account no..." style={{flex:1,border:'1px solid #e2e8f0',borderRadius:'5px',padding:'0.5rem 0.75rem',fontSize:'0.85rem'}}/>
          <Btn onClick={()=>navigate(`/transactions/${customAcc}`)}>Go →</Btn>
        </div>
        {txns.length===0 ? <p style={{color:'#718096',fontSize:'0.85rem'}}>No transactions.</p> : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['TXN ID','From','To','Amount','Note','Time'].map(h=><th key={h} style={{textAlign:'left',fontSize:'0.7rem',color:'#718096',padding:'0.5rem 0.75rem',borderBottom:'2px solid #e2e8f0',textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
            <tbody>{txns.map(t=>(
              <tr key={t.id} style={{borderBottom:'1px solid #f0f4f8'}}>
                <td style={{padding:'0.65rem 0.75rem',fontSize:'0.78rem',fontFamily:'monospace',color:'#718096'}}>{t.txn_id}</td>
                <td style={{padding:'0.65rem 0.75rem',fontSize:'0.82rem',fontFamily:'monospace'}}>{t.from_account}</td>
                <td style={{padding:'0.65rem 0.75rem',fontSize:'0.82rem',fontFamily:'monospace'}}>{t.to_account}</td>
                <td style={{padding:'0.65rem 0.75rem',fontSize:'0.85rem',fontWeight:700,color:t.from_account===acc?'#e53e3e':'#38a169'}}>₹{Number(t.amount).toLocaleString('en-IN')}</td>
                <td style={{padding:'0.65rem 0.75rem',fontSize:'0.82rem',color:'#718096'}}>{t.note}</td>
                <td style={{padding:'0.65rem 0.75rem',fontSize:'0.72rem',color:'#718096'}}>{t.timestamp?.slice(0,16)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </Layout>
  )
}

// ── PROFILE (Mass Assignment) ─────────────────────
export function Profile({ user, setUser }) {
  const [form, setForm] = useState({ email: user.email||'', phone: '', role: '', balance: '', credit_score: '' })
  const [msg, setMsg] = useState('')
  const [result, setResult] = useState(null)

  const submit = async (e) => {
    e.preventDefault(); setMsg(''); setResult(null)
    const body = {}
    Object.entries(form).forEach(([k,v]) => { if(v) body[k]=v })
    const res = await fetch('/api/profile', { method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(body) })
    const data = await res.json()
    if (res.ok) { setMsg('Profile updated!'); setResult(data.updated) }
  }

  return (
    <Layout user={user} setUser={setUser} title="Edit Profile">
      <Card style={{maxWidth:'550px'}}>
        <VulnBox>⚠️ <strong>Mass Assignment:</strong> The API accepts <code>role</code>, <code>balance</code>, <code>credit_score</code> fields! Try setting <code>role = admin</code> or <code>balance = 9999999</code>!</VulnBox>
        {msg && <div style={{background:'#f0fff4',color:'#276749',padding:'0.75rem',borderRadius:'5px',fontSize:'0.85rem',marginBottom:'1rem'}}>{msg}</div>}
        {result && <pre style={{background:'#1a202c',color:'#68d391',padding:'0.75rem',borderRadius:'5px',fontSize:'0.78rem',marginBottom:'1rem'}}>{JSON.stringify(result,null,2)}</pre>}
        <form onSubmit={submit}>
          {[['Email','email','email'],['Phone','phone','text'],['Role (try: admin)','role','text'],['Balance (try: 9999999)','balance','number'],['Credit Score','credit_score','number']].map(([l,n,t])=>(
            <div key={n} style={{marginBottom:'0.85rem'}}>
              <label style={{display:'block',fontSize:'0.78rem',fontWeight:500,color:'#718096',marginBottom:'0.35rem'}}>{l}</label>
              <input type={t} value={form[n]} onChange={e=>setForm({...form,[n]:e.target.value})} placeholder={`Enter ${l}`} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'0.6rem 0.9rem',fontSize:'0.88rem',outline:'none'}}/>
            </div>
          ))}
          <Btn type="submit" style={{width:'100%',marginTop:'0.5rem'}}>Update Profile →</Btn>
        </form>
      </Card>
    </Layout>
  )
}

// ── SEARCH (SQLi + Reflected XSS) ─────────────────
export function Search({ user }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const search = async (e) => {
    e.preventDefault(); setError('')
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { credentials:'include' })
    const data = await res.json()
    if (res.ok) setResults(data)
    else { setError(data.error); setResults(data) }
  }

  return (
    <Layout user={user} title="Account Search">
      <Card>
        <VulnBox>
          ⚠️ <strong>SQL Injection + Reflected XSS:</strong><br/>
          SQLi: <code>' OR '1'='1</code> — dumps all accounts<br/>
          XSS: <code>&lt;img src=x onerror=alert(1)&gt;</code> — executes in results
        </VulnBox>
        <form onSubmit={search} style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem'}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or account no..." style={{flex:1,border:'1px solid #e2e8f0',borderRadius:'6px',padding:'0.65rem 0.9rem',fontSize:'0.9rem',outline:'none'}}/>
          <Btn type="submit">Search →</Btn>
        </form>
        {error && <div style={{background:'#fff5f5',color:'#c53030',padding:'0.75rem',borderRadius:'5px',fontSize:'0.82rem',marginBottom:'0.75rem',fontFamily:'monospace'}}>{error}</div>}
        {results && (
          <div>
            {/* VULN: Reflected XSS via dangerouslySetInnerHTML */}
            <div style={{fontSize:'0.82rem',color:'#718096',marginBottom:'0.75rem'}} dangerouslySetInnerHTML={{__html:`Search results for: <strong>${results.query || q}</strong> (${results.results?.length || 0} found)`}} />
            {results.results?.length > 0 && (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['ID','Account','Username','Name','Email'].map(h=><th key={h} style={{textAlign:'left',fontSize:'0.7rem',color:'#718096',padding:'0.5rem 0.75rem',borderBottom:'2px solid #e2e8f0',textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                <tbody>{results.results.map((r,i)=>(
                  <tr key={r.id} style={{background:i%2===0?'#fff':'#f7fafc',borderBottom:'1px solid #f0f4f8'}}>
                    <td style={{padding:'0.65rem 0.75rem',fontSize:'0.82rem'}}>{r.id}</td>
                    <td style={{padding:'0.65rem 0.75rem',fontSize:'0.82rem',fontFamily:'monospace',color:'#0d3b8c'}}>{r.account_no}</td>
                    <td style={{padding:'0.65rem 0.75rem',fontSize:'0.82rem'}}>{r.username}</td>
                    <td style={{padding:'0.65rem 0.75rem',fontSize:'0.85rem',fontWeight:500}}>{r.full_name}</td>
                    <td style={{padding:'0.65rem 0.75rem',fontSize:'0.82rem',color:'#718096'}}>{r.email}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}
      </Card>
    </Layout>
  )
}

// ── DOCUMENTS (Insecure File Access) ──────────────
export function Docs({ user }) {
  const [filename, setFilename] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const fetch_doc = async (f) => {
    setError(''); setContent(''); setFilename(f)
    const res = await fetch(`/api/docs/${f}`, { credentials:'include' })
    const data = await res.json()
    if (res.ok) setContent(data.content)
    else setError(data.error)
  }

  return (
    <Layout user={user} title="Documents">
      <Card>
        <VulnBox>⚠️ <strong>Insecure Direct File Access:</strong> Try accessing <code>internal_audit.txt</code> — it's a confidential file with admin credentials!</VulnBox>
        <h3 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'1rem'}}>Available Documents</h3>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'1rem'}}>
          {['terms.pdf','interest_rates.pdf','internal_audit.txt'].map(f=>(
            <button key={f} onClick={()=>fetch_doc(f)} style={{background:filename===f?'#0d3b8c':'#f0f4f8',color:filename===f?'#fff':f.includes('audit')?'#e53e3e':'#0d3b8c',border:`1px solid ${f.includes('audit')?'#e53e3e':'#e2e8f0'}`,borderRadius:'6px',padding:'0.5rem 1rem',fontSize:'0.82rem',cursor:'pointer',fontWeight:f.includes('audit')?700:400}}>{f}{f.includes('audit')?' 🔒':''}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
          <input value={filename} onChange={e=>setFilename(e.target.value)} placeholder="Enter filename directly..." style={{flex:1,border:'1px solid #e2e8f0',borderRadius:'5px',padding:'0.5rem 0.75rem',fontSize:'0.85rem'}}/>
          <Btn onClick={()=>fetch_doc(filename)}>Fetch</Btn>
        </div>
        {error && <div style={{background:'#fff5f5',color:'#c53030',padding:'0.75rem',borderRadius:'5px',fontSize:'0.83rem',marginBottom:'0.75rem'}}>{error}</div>}
        {content && <pre style={{background:'#1a202c',color:'#68d391',padding:'1rem',borderRadius:'6px',fontSize:'0.82rem',whiteSpace:'pre-wrap'}}>{content}</pre>}
      </Card>
    </Layout>
  )
}

// ── ADMIN (Broken Access Control via JWT) ─────────
export function Admin({ user }) {
  const [users, setUsers] = useState([])
  const [loans, setLoans] = useState([])
  const [error, setError] = useState('')
  const [jwtInfo, setJwtInfo] = useState(null)

  const loadUsers = async () => {
    setError('')
    const res = await fetch('/api/admin/users', { credentials:'include' })
    const data = await res.json()
    if (res.ok) setUsers(data)
    else setError(data.error)
  }

  useEffect(() => {
    // Show decoded JWT
    const token = document.cookie.split(';').find(c=>c.trim().startsWith('token_b='))?.split('=')[1]
    if (token) {
      try {
        const [,payload] = token.split('.')
        setJwtInfo(JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/'))))
      } catch(e) {}
    }
  }, [])

  return (
    <Layout user={user} title="Admin Panel">
      <Card>
        <VulnBox>
          ⚠️ <strong>Broken Access Control via Weak JWT:</strong><br/>
          1. Copy your JWT from cookie: <code>token_b</code><br/>
          2. Go to <a href="https://jwt.io" target="_blank" style={{color:'#0d3b8c'}}>jwt.io</a><br/>
          3. Change <code>"role":"customer"</code> to <code>"role":"admin"</code><br/>
          4. Sign with secret: <code>secret</code> — paste new token in cookie!
        </VulnBox>
        {jwtInfo && (
          <div style={{background:'#f0f4f8',borderRadius:'6px',padding:'0.85rem',marginBottom:'1rem'}}>
            <div style={{fontSize:'0.78rem',color:'#718096',marginBottom:'0.5rem'}}>Your JWT Payload:</div>
            <pre style={{fontSize:'0.8rem',color:'#1a202c'}}>{JSON.stringify(jwtInfo,null,2)}</pre>
          </div>
        )}
        {error && <div style={{background:'#fff5f5',color:'#c53030',padding:'0.75rem',borderRadius:'5px',fontSize:'0.83rem',marginBottom:'1rem'}}>{error}</div>}
        <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem'}}>
          <Btn onClick={loadUsers}>Load All Users</Btn>
          <Btn variant="outline" onClick={async()=>{const r=await fetch('/api/admin/loans',{credentials:'include'});if(r.ok)setLoans(await r.json());else setError((await r.json()).error)}}>Load All Loans</Btn>
        </div>
        {users.length>0 && (
          <div style={{overflowX:'auto',marginBottom:'1rem'}}>
            <h4 style={{fontSize:'0.85rem',fontWeight:600,marginBottom:'0.75rem',color:'#0d3b8c'}}>All Users</h4>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['ID','Account','Name','Email','Balance','Role','Credit Score'].map(h=><th key={h} style={{textAlign:'left',fontSize:'0.7rem',color:'#718096',padding:'0.5rem 0.75rem',borderBottom:'2px solid #e2e8f0',textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
              <tbody>{users.map((u,i)=>(
                <tr key={u.id} style={{background:i%2===0?'#fff':'#f7fafc'}}>
                  <td style={{padding:'0.6rem 0.75rem',fontSize:'0.82rem'}}>{u.id}</td>
                  <td style={{padding:'0.6rem 0.75rem',fontSize:'0.82rem',fontFamily:'monospace',color:'#0d3b8c'}}>{u.account_no}</td>
                  <td style={{padding:'0.6rem 0.75rem',fontSize:'0.85rem',fontWeight:500}}>{u.full_name}</td>
                  <td style={{padding:'0.6rem 0.75rem',fontSize:'0.82rem',color:'#718096'}}>{u.email}</td>
                  <td style={{padding:'0.6rem 0.75rem',fontWeight:700,color:'#38a169'}}>₹{Number(u.balance||0).toLocaleString('en-IN')}</td>
                  <td style={{padding:'0.6rem 0.75rem'}}><span style={{background:u.role==='admin'?'#fff5f5':'#f0f4f8',color:u.role==='admin'?'#e53e3e':'#718096',padding:'0.15rem 0.5rem',borderRadius:'3px',fontSize:'0.72rem',fontWeight:600}}>{u.role}</span></td>
                  <td style={{padding:'0.6rem 0.75rem',fontSize:'0.82rem'}}>{u.credit_score}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {loans.length>0 && (
          <div>
            <h4 style={{fontSize:'0.85rem',fontWeight:600,marginBottom:'0.75rem',color:'#0d3b8c'}}>All Loans</h4>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['Name','Amount','EMI','Status','Purpose'].map(h=><th key={h} style={{textAlign:'left',fontSize:'0.7rem',color:'#718096',padding:'0.5rem 0.75rem',borderBottom:'2px solid #e2e8f0',textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
              <tbody>{loans.map((l,i)=>(
                <tr key={l.id} style={{background:i%2===0?'#fff':'#f7fafc'}}>
                  <td style={{padding:'0.65rem 0.75rem',fontWeight:500}}>{l.full_name}</td>
                  <td style={{padding:'0.65rem 0.75rem',fontWeight:700,color:'#0d3b8c'}}>₹{Number(l.amount||0).toLocaleString('en-IN')}</td>
                  <td style={{padding:'0.65rem 0.75rem'}}>₹{Number(l.emi||0).toLocaleString('en-IN')}</td>
                  <td style={{padding:'0.65rem 0.75rem'}}><span style={{background:l.status==='approved'?'#f0fff4':'#fffbeb',color:l.status==='approved'?'#276749':'#92400e',padding:'0.15rem 0.5rem',borderRadius:'3px',fontSize:'0.72rem',fontWeight:600}}>{l.status}</span></td>
                  <td style={{padding:'0.65rem 0.75rem',color:'#718096',fontSize:'0.82rem'}}>{l.purpose}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  )
}
