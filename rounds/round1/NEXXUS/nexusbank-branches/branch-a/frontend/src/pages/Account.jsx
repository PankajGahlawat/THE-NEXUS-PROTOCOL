import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout, { Card, Btn, Input } from '../components/Layout'

export default function Account({ user }) {
  const { acc } = useParams()
  const [account, setAccount] = useState(null)
  const [error, setError] = useState('')
  const [customAcc, setCustomAcc] = useState('')
  const navigate = useNavigate()

  const fetchAccount = async (accNo) => {
    setError('')
    try {
      const res = await fetch(`/api/account/${accNo}`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) setAccount(data)
      else setError(data.error)
    } catch { setError('Error fetching account') }
  }

  useEffect(() => { fetchAccount(acc) }, [acc])

  return (
    <Layout user={user} title="Account Details">
      {/* IDOR Test Panel */}
      <Card style={{ background: '#fffbeb', borderColor: '#f6ad55' }}>
        <div style={{ fontSize: '0.82rem', color: '#92400e', marginBottom: '0.75rem', fontWeight: 600 }}>🔍 View Account by Number (IDOR Test)</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {['ACC001','ACC002','ACC003','ACC004','ACC005'].map(a => (
            <button key={a} onClick={() => navigate(`/account/${a}`)} style={{ background: a === acc ? '#1a3c6e' : '#fff', color: a === acc ? '#fff' : '#1a3c6e', border: '1px solid #1a3c6e', borderRadius: '5px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', cursor: 'pointer' }}>{a}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={customAcc} onChange={e => setCustomAcc(e.target.value)} placeholder="Enter any account no..." style={{ border: '1px solid #e2e8f0', borderRadius: '5px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', flex: 1 }} />
          <Btn onClick={() => navigate(`/account/${customAcc}`)} style={{ whiteSpace: 'nowrap' }}>Go →</Btn>
        </div>
      </Card>

      {error && <div style={{ background: '#fff5f5', color: '#c53030', borderLeft: '3px solid #e53e3e', padding: '0.85rem 1rem', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}

      {account && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <Card>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a3c6e', marginBottom: '1rem' }}>👤 Account Holder</h3>
            {[['Full Name', account.full_name],['Username', account.username],['Email', account.email],['Phone', account.phone],['Address', account.address],].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'0.6rem 0', borderBottom:'1px solid #f0f4f8' }}>
                <span style={{ fontSize:'0.8rem', color:'#718096' }}>{k}</span>
                <span style={{ fontSize:'0.85rem', fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e53e3e', marginBottom: '1rem' }}>🔒 Sensitive Information</h3>
            {[['Account No', account.account_no],['Balance', `₹${Number(account.balance || 0).toLocaleString('en-IN')}`],['PAN Number', account.pan],['IFSC Code', account.ifsc],['Password Hash', account.password],].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'0.6rem 0', borderBottom:'1px solid #f0f4f8' }}>
                <span style={{ fontSize:'0.8rem', color:'#718096' }}>{k}</span>
                <span style={{ fontSize:'0.82rem', fontWeight:500, fontFamily:k.includes('Hash')||k.includes('PAN')?'monospace':'inherit', color:k.includes('Sensitive')||k==='PAN Number'||k==='Password Hash'?'#e53e3e':'inherit' }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </Layout>
  )
}
