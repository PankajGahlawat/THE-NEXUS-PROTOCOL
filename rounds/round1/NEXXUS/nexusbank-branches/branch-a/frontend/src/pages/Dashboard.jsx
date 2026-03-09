import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout, { Card, Btn, Alert } from '../components/Layout'

export default function Dashboard({ user, setUser }) {
  const [txns, setTxns] = useState([])

  useEffect(() => {
    fetch('/api/transactions', { credentials: 'include' }).then(r => r.json()).then(setTxns).catch(() => {})
  }, [])

  return (
    <Layout user={user} setUser={setUser} title="Dashboard">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          ['Account No', user.account_no, '#1a3c6e'],
          ['Available Balance', `₹${Number(user.balance || 0).toLocaleString('en-IN')}`, '#38a169'],
          ['Email', user.email || '—', '#718096'],
        ].map(([label, value, color]) => (
          <Card key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{value}</div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to={`/account/${user.account_no}`}><Btn>💳 View Account</Btn></Link>
          <Link to="/transfer"><Btn>💸 Transfer Funds</Btn></Link>
          <Link to="/feedback"><Btn variant="outline">💬 Submit Feedback</Btn></Link>
          <Link to="/statement"><Btn variant="outline">📄 Download Statement</Btn></Link>
          <Link to="/all-accounts"><Btn variant="outline">👥 All Accounts (API)</Btn></Link>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: '#1a3c6e' }}>Recent Transactions</h3>
        {txns.length === 0 ? <p style={{ color: '#718096', fontSize: '0.85rem' }}>No transactions found.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['From','To','Amount','Note','Time'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: '#718096', padding: '0.5rem 0.75rem', borderBottom: '2px solid #e2e8f0' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>{t.from_account}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>{t.to_account}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: t.from_account === user.account_no ? '#e53e3e' : '#38a169' }}>
                    {t.from_account === user.account_no ? '-' : '+'}₹{Number(t.amount).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#718096' }}>{t.note || '—'}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#718096' }}>{t.timestamp?.slice(0,16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Layout>
  )
}
