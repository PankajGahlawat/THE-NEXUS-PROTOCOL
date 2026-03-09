import { useNavigate, Link } from 'react-router-dom'

export default function Layout({ user, setUser, children, title }) {
  const navigate = useNavigate()

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* TOPBAR */}
      <div style={{ background: 'var(--primary)', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.05em' }}>🏦 NexusBank</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Branch A — Andheri</span>
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>👤 {user.full_name || user.username}</span>
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '5px', fontSize: '0.8rem' }}>Logout</button>
          </div>
        )}
      </div>

      {/* NAV */}
      {user && (
        <div style={{ background: 'var(--primary-light)', padding: '0 2rem', display: 'flex', gap: '0.25rem' }}>
          {[
            ['/dashboard', '🏠 Dashboard'],
            [`/account/${user.account_no}`, '💳 My Account'],
            ['/transfer', '💸 Transfer'],
            ['/feedback', '💬 Feedback'],
            ['/statement', '📄 Statement'],
            ['/all-accounts', '👥 All Accounts'],
          ].map(([to, label]) => (
            <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.85)', padding: '0.65rem 1rem', fontSize: '0.82rem', display: 'block', borderBottom: '2px solid transparent' }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}>{label}</Link>
          ))}
        </div>
      )}

      {/* CONTENT */}
      <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {title && <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.5rem' }}>{title}</h1>}
        {children}
      </div>
    </div>
  )
}

export function Card({ children, style = {} }) {
  return <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }}>{children}</div>
}

export function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '0.4rem' }}>{label}</label>}
      <input {...props} style={{ width: '100%', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.65rem 0.9rem', fontSize: '0.9rem', outline: 'none', ...props.style }} />
    </div>
  )
}

export function Btn({ children, variant = 'primary', ...props }) {
  const styles = {
    primary: { background: 'var(--primary)', color: '#fff' },
    danger:  { background: 'var(--danger)', color: '#fff' },
    outline: { background: '#fff', border: '1px solid var(--border)', color: 'var(--primary)' },
    success: { background: 'var(--success)', color: '#fff' },
  }
  return <button {...props} style={{ padding: '0.65rem 1.5rem', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', ...styles[variant], ...props.style }}>{children}</button>
}

export function Alert({ type = 'info', children }) {
  const colors = { info: '#ebf8ff:#2b6cb0', success: '#f0fff4:#276749', error: '#fff5f5:#c53030', warning: '#fffbeb:#92400e' }
  const [bg, color] = colors[type].split(':')
  return <div style={{ background: bg, color, padding: '0.85rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', borderLeft: `3px solid ${color}` }}>{children}</div>
}
