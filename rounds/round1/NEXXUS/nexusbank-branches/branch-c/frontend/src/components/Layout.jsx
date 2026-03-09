import { useNavigate, Link } from 'react-router-dom'

const PRIMARY = '#1b5e3b'
const ACCENT = '#c8a84b'

export default function Layout({ user, setUser, children, title }) {
  const navigate = useNavigate()
  
  const logout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {/* TOPBAR */}
      <div style={{ background: PRIMARY, padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: ACCENT, fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.05em' }}>🏦 NexusBank</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Branch C — Colaba</span>
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>👤 {user.full_name || user.username}</span>
            {user.role === 'admin' && <span style={{ background: '#e53e3e', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '3px', fontWeight: 700 }}>ADMIN</span>}
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '5px', fontSize: '0.8rem', cursor: 'pointer' }}>Logout</button>
          </div>
        )}
      </div>

      {/* NAV */}
      {user && (
        <div style={{ background: '#247a52', padding: '0 2rem', display: 'flex', gap: '0.25rem' }}>
          {[
            ['/dashboard', '🏠 Dashboard'],
            ['/loans', '💰 Loans'],
            ['/documents', '📄 Documents'],
            ['/profile', '✏️ Profile'],
            ['/tickets', '🎫 Support'],
          ].map(([to, label]) => (
            <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.85)', padding: '0.65rem 1rem', fontSize: '0.82rem', display: 'block' }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}>{label}</Link>
          ))}
        </div>
      )}

      {/* CONTENT */}
      <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {title && <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: PRIMARY, marginBottom: '1.5rem' }}>{title}</h1>}
        {children}
      </div>
    </div>
  )
}

export function Card({ children, style = {} }) {
  return <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }}>{children}</div>
}

export function Btn({ children, variant = 'primary', ...props }) {
  const styles = {
    primary: { background: PRIMARY, color: '#fff' },
    danger: { background: '#e53e3e', color: '#fff' },
    outline: { background: '#fff', border: '1px solid #e2e8f0', color: PRIMARY },
    success: { background: '#38a169', color: '#fff' },
  }
  return <button {...props} style={{ padding: '0.65rem 1.5rem', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', ...styles[variant], ...props.style }}>{children}</button>
}

export function VulnBox({ children }) {
  return <div style={{ background: '#fffbeb', border: '1px solid #f6ad55', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#92400e' }}>{children}</div>
}
