import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Account from './pages/Account'
import Transfer from './pages/Transfer'
import Feedback from './pages/Feedback'
import Statement from './pages/Statement'
import AllAccounts from './pages/AllAccounts'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:'1rem',color:'#718096'}}>Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login setUser={setUser}/> : <Navigate to="/dashboard"/>} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser}/> : <Navigate to="/login"/>} />
        <Route path="/account/:acc" element={user ? <Account user={user}/> : <Navigate to="/login"/>} />
        <Route path="/transfer" element={user ? <Transfer user={user} setUser={setUser}/> : <Navigate to="/login"/>} />
        <Route path="/feedback" element={user ? <Feedback user={user}/> : <Navigate to="/login"/>} />
        <Route path="/statement" element={user ? <Statement user={user}/> : <Navigate to="/login"/>} />
        <Route path="/all-accounts" element={user ? <AllAccounts/> : <Navigate to="/login"/>} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"}/>} />
      </Routes>
    </BrowserRouter>
  )
}
