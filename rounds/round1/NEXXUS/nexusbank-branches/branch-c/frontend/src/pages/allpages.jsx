import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const P = '#1b5e3b'
const A = '#c8a84b'

function Layout({ user, setUser, children, title }) {
  const navigate = useNavigate()
  const logout = async () => { await fetch('/api/logout',{method:'POST',credentials:'include'}); setUser(null); navigate('/login') }
  return (
    <div style={{minHeight:'100vh',background:'#f0f4f8'}}>
      <div style={{background:P,padding:'0 2rem',height:'60px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
          <span style={{color:A,fontWeight:700,fontSize:'1.2rem'}}>🏦 NexusBank</span>
          <span style={{color:'rgba(255,255,255,0.5)',fontSize:'0.8rem'}}>Branch C — Colaba</span>
        </div>
        {user && <div style={{display:'flex',alignItems:'center',gap:'1.5rem'}}>
          <span style={{color:'rgba(255,255,255,0.8)',fontSize:'0.85rem'}}>👤 {user.full_name||user.username}</span>
          <button onClick={logout} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',padding:'0.4rem 1rem',borderRadius:'5px',fontSize:'0.8rem',cursor:'pointer'}}>Logout</button>
        </div>}
      </div>
      {user && <div style={{background:'#247a52',padding:'0 2rem',display:'flex',gap:'0.25rem'}}>
        {[['/dashboard','🏠 Dashboard'],['/loans','💰 Loans'],['/documents','📄 Documents'],['/profile','✏️ Profile'],['/tickets','🎫 Support']].map(([to,label])=>(
          <Link key={to} to={to} style={{color:'rgba(255,255,255,0.85)',padding:'0.65rem 1rem',fontSize:'0.82rem',display:'block'}}
            onMouseEnter={e=>e.target.style.background='rgba(255,255,255,0.1)'}
            onMouseLeave={e=>e.target.style.background='transparent'}>{label}</Link>
        ))}
      </div>}
      <div style={{maxWidth:'1100px',margin:'2rem auto',padding:'0 1.5rem'}}>
        {title && <h1 style={{fontSize:'1.4rem',fontWeight:700,color:P,marginBottom:'1.5rem'}}>{title}</h1>}
        {children}
      </div>
    </div>
  )
}
function Card({children,style={}}) { return <div style={{background:'#fff',borderRadius:'10px',border:'1px solid #e2e8f0',padding:'1.5rem',marginBottom:'1.25rem',...style}}>{children}</div> }
function Btn({children,variant='primary',...props}) {
  const s={primary:{background:P,color:'#fff'},danger:{background:'#e53e3e',color:'#fff'},outline:{background:'#fff',border:'1px solid #e2e8f0',color:P}}
  return <button {...props} style={{padding:'0.65rem 1.5rem',borderRadius:'6px',border:'none',fontWeight:600,fontSize:'0.88rem',cursor:'pointer',...s[variant],...props.style}}>{children}</button>
}
function VBox({children}) { return <div style={{background:'#fffbeb',border:'1px solid #f6ad55',borderRadius:'6px',padding:'0.75rem 1rem',marginBottom:'1rem',fontSize:'0.8rem',color:'#92400e'}}>{children}</div> }

// ── LOGIN ──────────────────────────────────────
export function Login({ setUser }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const login = async (e) => {
    e.preventDefault(); setError('')
    const res = await fetch('/api/login', { method: 'POST', headers: {'Content-Type':'application/json'}, credentials: 'include', body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok) { setUser(data.user); navigate('/dashboard') }
    else setError(data.error || 'Login failed')
  }

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#1b5e3b,#247a52)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',maxWidth:'900px',width:'90%',background:'#fff',borderRadius:'16px',overflow:'hidden',boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}}>
        <div style={{background:'linear-gradient(160deg,#1b5e3b,#247a52)',padding:'3rem',color:'#fff',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:'1.8rem',fontWeight:800,color:A}}>NexusBank</div>
            <div style={{fontSize:'0.8rem',opacity:0.6,marginTop:'0.25rem'}}>Branch C — Colaba Heritage</div>
          </div>
          <div>
            {[['🏦','Loan Services','Home, car & personal loans'],['💳','Cookie Banking','Session-based security'],['🔍','Ticket Support','24/7 customer service'],['📄','Documents','Download important docs']].map(([i,t,d])=>(
              <div key={t} style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem'}}>
                <span style={{fontSize:'1.2rem'}}>{i}</span>
                <div><div style={{fontWeight:600,fontSize:'0.88rem'}}>{t}</div><div style={{fontSize:'0.75rem',opacity:0.6}}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={{fontSize:'0.72rem',opacity:0.4}}>© 2025 NexusBank Ltd.</div>
        </div>
        <div style={{padding:'3rem'}}>
          <h2 style={{fontSize:'1.5rem',fontWeight:700,color:P,marginBottom:'0.5rem'}}>Welcome Back</h2>
          <p style={{color:'#718096',fontSize:'0.85rem',marginBottom:'2rem'}}>Branch C — Colaba Internet Banking</p>
          {error && <div style={{background:'#fff5f5',color:'#c53030',borderLeft:'3px solid #e53e3e',padding:'0.75rem 1rem',borderRadius:'4px',fontSize:'0.83rem',marginBottom:'1rem'}}>{error}</div>}
          <form onSubmit={login}>
            {[['Username','username','text'],['Password','password','password']].map(([l,n,t])=>(
              <div key={n} style={{marginBottom:'1rem'}}>
                <label style={{display:'block',fontSize:'0.78rem',fontWeight:500,color:'#718096',marginBottom:'0.4rem'}}>{l}</label>
                <input type={t} value={form[n]} onChange={e=>setForm({...form,[n]:e.target.value})} placeholder={`Enter ${l.toLowerCase()}`} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'0.7rem 0.9rem',fontSize:'0.9rem',outline:'none'}}/>
              </div>
            ))}
            <button type="submit" style={{width:'100%',background:P,color:'#fff',border:'none',borderRadius:'6px',padding:'0.8rem',fontWeight:700,fontSize:'0.95rem',cursor:'pointer',marginTop:'0.5rem'}}>Sign In →</button>
          </form>
          <div style={{background:'#f7fafc',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'0.85rem',marginTop:'1.5rem',fontSize:'0.78rem',color:'#718096'}}>
            <strong style={{color:P}}>Try:</strong> kavya / kavya123 &nbsp;·&nbsp; <span style={{color:'#e53e3e',fontWeight:600}}>admin / admin</span> (default!)
          </div>
        </div>
      </div>
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────
export function Dashboard({ user, setUser }) {
  const [cookieData, setCookieData] = useState(null)

  useEffect(() => {
    const c = document.cookie.split(';').find(x=>x.trim().startsWith('session_c='))?.split('=')[1]
    if (c) {
      try { setCookieData(JSON.parse(atob(c))) } catch(e) {}
    }
  }, [])

  return (
    <Layout user={user} setUser={setUser} title="Dashboard">
      <VBox>
        🍪 <strong>Cookie Manipulation:</strong> Your session is stored in <code>session_c</code> cookie as plain base64 JSON!<br/>
        Open DevTools → Application → Cookies → Copy <code>session_c</code> → Decode at base64decode.org → Change <code>role</code> to <code>"admin"</code> or <code>balance</code> to <code>9999999</code> → Re-encode → Replace cookie!
      </VBox>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'1.5rem'}}>
        {[['Account',user.account_no,'#1b5e3b'],['Balance',`₹${Number(user.balance||0).toLocaleString('en-IN')}`,'#38a169'],['Role',user.role||'customer',user.role==='admin'?'#e53e3e':'#718096']].map(([l,v,c])=>(
          <Card key={l} style={{textAlign:'center'}}>
            <div style={{fontSize:'0.75rem',color:'#718096',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.5rem'}}>{l}</div>
            <div style={{fontSize:'1.3rem',fontWeight:700,color:c}}>{v}</div>
          </Card>
        ))}
      </div>
      {cookieData && (
        <Card>
          <h3 style={{fontSize:'0.85rem',fontWeight:600,marginBottom:'0.75rem',color:P}}>🍪 Your Cookie Data (Base64 Decoded)</h3>
          <pre style={{background:'#1a202c',color:'#68d391',padding:'1rem',borderRadius:'6px',fontSize:'0.82rem'}}>{JSON.stringify(cookieData,null,2)}</pre>
        </Card>
      )}
      <Card>
        <h3 style={{fontSize:'0.85rem',fontWeight:600,color:'#718096',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'1rem'}}>Quick Actions</h3>
        <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
          <Link to="/loans"><Btn>💰 View Loans</Btn></Link>
          <Link to="/documents"><Btn variant="outline">📄 Documents</Btn></Link>
          <Link to="/profile"><Btn variant="outline">✏️ Edit Profile</Btn></Link>
          <Link to="/tickets"><Btn variant="outline">🎫 Support Tickets</Btn></Link>
        </div>
      </Card>
    </Layout>
  )
}

// ── LOANS (IDOR + API Enum) ────────────────────
export function Loans({ user }) {
  const [loanId, setLoanId] = useState('')
  const [loan, setLoan] = useState(null)
  const [myLoans, setMyLoans] = useState([])
  const [error, setError] = useState('')

  useEffect(() => { fetch('/api/my-loans',{credentials:'include'}).then(r=>r.json()).then(setMyLoans) }, [])

  const fetchLoan = async (id) => {
    setError(''); setLoan(null)
    const res = await fetch(`/api/loan/${id}`,{credentials:'include'})
    const data = await res.json()
    if (res.ok) setLoan(data)
    else setError(data.error)
  }

  return (
    <Layout user={user} title="Loan Details">
      <VBox>⚠️ <strong>IDOR + API Enumeration:</strong> Loan IDs are sequential (1,2,3,4). Try each — Loan #4 belongs to admin with ₹9,99,999!</VBox>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>
        <Card>
          <h3 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'0.75rem',color:P}}>Fetch Any Loan by ID</h3>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>
            {[1,2,3,4].map(id=>(
              <button key={id} onClick={()=>fetchLoan(id)} style={{background:'#f0f4f8',border:'1px solid #e2e8f0',borderRadius:'5px',padding:'0.4rem 0.85rem',fontSize:'0.82rem',cursor:'pointer',color:P,fontWeight:600}}>Loan #{id}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <input value={loanId} onChange={e=>setLoanId(e.target.value)} placeholder="Enter loan ID..." style={{flex:1,border:'1px solid #e2e8f0',borderRadius:'5px',padding:'0.5rem 0.75rem',fontSize:'0.85rem'}}/>
            <Btn onClick={()=>fetchLoan(loanId)}>Fetch →</Btn>
          </div>
          {error && <div style={{background:'#fff5f5',color:'#c53030',padding:'0.6rem',borderRadius:'4px',fontSize:'0.82rem',marginTop:'0.75rem'}}>{error}</div>}
          {loan && (
            <div style={{marginTop:'1rem'}}>
              {[['Account',loan.account_no],['Holder',loan.full_name],['Amount',`₹${Number(loan.amount||0).toLocaleString('en-IN')}`],['EMI',`₹${Number(loan.emi||0).toLocaleString('en-IN')}`],['Status',loan.status],['Purpose',loan.purpose],['Guarantor',loan.guarantor],['Approved By',loan.approved_by]].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:'1px solid #f0f4f8'}}>
                  <span style={{fontSize:'0.78rem',color:'#718096'}}>{k}</span>
                  <span style={{fontSize:'0.85rem',fontWeight:500,color:k==='Status'&&v==='approved'?'#38a169':k==='Amount'?'#1b5e3b':'inherit'}}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'0.75rem',color:P}}>My Loans</h3>
          {myLoans.length===0 ? <p style={{color:'#718096',fontSize:'0.85rem'}}>No loans found.</p> : myLoans.map(l=>(
            <div key={l.id} style={{padding:'0.75rem',background:'#f7fafc',borderRadius:'6px',marginBottom:'0.5rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.3rem'}}>
                <span style={{fontWeight:600,fontSize:'0.88rem'}}>{l.purpose}</span>
                <span style={{background:l.status==='approved'?'#f0fff4':'#fffbeb',color:l.status==='approved'?'#276749':'#92400e',padding:'0.15rem 0.5rem',borderRadius:'3px',fontSize:'0.7rem',fontWeight:600}}>{l.status}</span>
              </div>
              <div style={{fontSize:'0.82rem',color:'#718096'}}>Amount: ₹{Number(l.amount||0).toLocaleString('en-IN')} · EMI: ₹{Number(l.emi||0).toLocaleString('en-IN')}/mo</div>
            </div>
          ))}
        </Card>
      </div>
    </Layout>
  )
}

// ── DOCUMENTS (Path Traversal) ─────────────────
export function Documents({ user }) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const fetchDoc = async (n) => {
    setError(''); setContent(''); setName(n)
    const res = await fetch(`/api/document?name=${encodeURIComponent(n)}`,{credentials:'include'})
    const data = await res.json()
    if (res.ok) setContent(data.content)
    else setError(data.error)
  }

  return (
    <Layout user={user} title="Documents">
      <Card>
        <VBox>⚠️ <strong>Path Traversal:</strong> The API doesn't sanitize file paths! Try: <code>../server_config.txt</code> to read the server configuration file with admin credentials!</VBox>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'1rem'}}>
          {['loan_guide.txt','interest_chart.txt','../server_config.txt'].map(f=>(
            <button key={f} onClick={()=>fetchDoc(f)} style={{background:name===f?P:'#f0f4f8',color:name===f?'#fff':f.includes('..')?'#e53e3e':P,border:`1px solid ${f.includes('..')?'#e53e3e':'#e2e8f0'}`,borderRadius:'6px',padding:'0.5rem 1rem',fontSize:'0.82rem',cursor:'pointer',fontWeight:f.includes('..')?700:400}}>{f}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter filename or path..." style={{flex:1,border:'1px solid #e2e8f0',borderRadius:'5px',padding:'0.5rem 0.75rem',fontSize:'0.85rem'}}/>
          <Btn onClick={()=>fetchDoc(name)}>Fetch</Btn>
        </div>
        {error && <div style={{background:'#fff5f5',color:'#c53030',padding:'0.75rem',borderRadius:'5px',fontSize:'0.83rem',marginBottom:'0.75rem'}}>{error}</div>}
        {content && <pre style={{background:'#1a202c',color:'#68d391',padding:'1rem',borderRadius:'6px',fontSize:'0.82rem',whiteSpace:'pre-wrap'}}>{content}</pre>}
      </Card>
    </Layout>
  )
}

// ── PROFILE (SQLi + CSRF) ──────────────────────
export function Profile({ user, setUser }) {
  const [form, setForm] = useState({ email: '', phone: '', nominee: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setMsg(''); setError('')
    const res = await fetch('/api/profile/update', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok) setMsg('Profile updated!')
    else setError(data.error)
  }

  const csrfTest = async () => {
    const res = await fetch('/api/profile/nominee', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({nominee:'HACKED BY CSRF', email:'hacker@evil.com'}) })
    const data = await res.json()
    if (res.ok) setMsg('CSRF attack worked! Nominee changed!')
  }

  return (
    <Layout user={user} setUser={setUser} title="Edit Profile">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>
        <Card>
          <h3 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'0.75rem',color:P}}>Update Profile</h3>
          <VBox>⚠️ <strong>SQL Injection:</strong> Try in any field: <code>' OR '1'='1' --</code><br/>Error messages expose the SQL query!</VBox>
          {msg && <div style={{background:'#f0fff4',color:'#276749',padding:'0.6rem',borderRadius:'4px',fontSize:'0.82rem',marginBottom:'0.75rem'}}>{msg}</div>}
          {error && <div style={{background:'#fff5f5',color:'#c53030',padding:'0.6rem',borderRadius:'4px',fontSize:'0.82rem',marginBottom:'0.75rem',fontFamily:'monospace'}}>{error}</div>}
          <form onSubmit={submit}>
            {[['Email','email'],['Phone','phone'],['Nominee Name','nominee']].map(([l,n])=>(
              <div key={n} style={{marginBottom:'0.85rem'}}>
                <label style={{display:'block',fontSize:'0.78rem',fontWeight:500,color:'#718096',marginBottom:'0.35rem'}}>{l}</label>
                <input value={form[n]} onChange={e=>setForm({...form,[n]:e.target.value})} placeholder={`Enter ${l}...`} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'0.6rem 0.9rem',fontSize:'0.88rem',outline:'none'}}/>
              </div>
            ))}
            <Btn type="submit" style={{width:'100%'}}>Update Profile →</Btn>
          </form>
        </Card>
        <Card>
          <h3 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'0.75rem',color:'#e53e3e'}}>🔴 CSRF Demo</h3>
          <VBox>⚠️ <strong>CSRF Attack:</strong> The nominee update endpoint has no CSRF token. Any website can send a POST request while you're logged in and change your nominee!</VBox>
          <p style={{fontSize:'0.82rem',color:'#718096',marginBottom:'1rem'}}>Click below to simulate a CSRF attack — this is what a malicious website would do in the background:</p>
          <Btn variant="danger" onClick={csrfTest} style={{width:'100%'}}>🚨 Simulate CSRF Attack</Btn>
          <p style={{fontSize:'0.75rem',color:'#718096',marginTop:'0.75rem',textAlign:'center'}}>This changes your nominee to "HACKED BY CSRF" without your consent</p>
        </Card>
      </div>
    </Layout>
  )
}

// ── TICKETS (API Enumeration) ──────────────────
export function Tickets({ user }) {
  const [ticketId, setTicketId] = useState('')
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const fetchTicket = async (id) => {
    setError(''); setTicket(null)
    const res = await fetch(`/api/ticket/${id}`,{credentials:'include'})
    const data = await res.json()
    if (res.ok) setTicket(data)
    else setError(data.error)
  }

  const submitTicket = async (e) => {
    e.preventDefault()
    // Just UI demo
    setSubmitted(true)
  }

  return (
    <Layout user={user} title="Support Tickets">
      <VBox>⚠️ <strong>API Enumeration (IDOR):</strong> Ticket IDs are sequential starting from 1. You can enumerate all tickets — including other customers' private complaints!</VBox>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>
        <Card>
          <h3 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'0.75rem',color:P}}>Enumerate Tickets</h3>
          <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.75rem'}}>
            {[1,2,3,4,5].map(id=>(
              <button key={id} onClick={()=>fetchTicket(id)} style={{background:'#f0f4f8',border:'1px solid #e2e8f0',borderRadius:'5px',padding:'0.4rem 0.75rem',fontSize:'0.82rem',cursor:'pointer',color:P,fontWeight:600}}>#{id}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.75rem'}}>
            <input value={ticketId} onChange={e=>setTicketId(e.target.value)} placeholder="Ticket ID..." style={{flex:1,border:'1px solid #e2e8f0',borderRadius:'5px',padding:'0.5rem 0.75rem',fontSize:'0.85rem'}}/>
            <Btn onClick={()=>fetchTicket(ticketId)}>Fetch →</Btn>
          </div>
          {error && <div style={{background:'#fff5f5',color:'#c53030',padding:'0.6rem',borderRadius:'4px',fontSize:'0.82rem'}}>{error}</div>}
          {ticket && (
            <div style={{background:'#f7fafc',borderRadius:'6px',padding:'0.85rem',marginTop:'0.5rem'}}>
              {[['Account',ticket.account_no],['Subject',ticket.subject],['Message',ticket.message],['Status',ticket.status],['Time',ticket.timestamp?.slice(0,16)]].map(([k,v])=>(
                <div key={k} style={{display:'flex',gap:'0.5rem',padding:'0.4rem 0',borderBottom:'1px solid #e2e8f0'}}>
                  <span style={{fontSize:'0.75rem',color:'#718096',minWidth:'80px'}}>{k}</span>
                  <span style={{fontSize:'0.82rem',fontWeight:k==='Subject'?600:400}}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'0.75rem',color:P}}>Submit New Ticket</h3>
          {submitted ? <div style={{background:'#f0fff4',color:'#276749',padding:'0.75rem',borderRadius:'5px',fontSize:'0.85rem'}}>✅ Ticket submitted! (Demo only)</div> : (
            <form onSubmit={submitTicket}>
              <div style={{marginBottom:'0.85rem'}}>
                <label style={{display:'block',fontSize:'0.78rem',fontWeight:500,color:'#718096',marginBottom:'0.35rem'}}>Subject</label>
                <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Brief subject..." style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'0.6rem 0.9rem',fontSize:'0.88rem',outline:'none'}}/>
              </div>
              <div style={{marginBottom:'0.85rem'}}>
                <label style={{display:'block',fontSize:'0.78rem',fontWeight:500,color:'#718096',marginBottom:'0.35rem'}}>Message</label>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} placeholder="Describe your issue..." style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'0.6rem 0.9rem',fontSize:'0.88rem',outline:'none',resize:'vertical'}}/>
              </div>
              <Btn type="submit" style={{width:'100%'}}>Submit Ticket →</Btn>
            </form>
          )}
        </Card>
      </div>
    </Layout>
  )
}
