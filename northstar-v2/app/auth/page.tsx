'use client'
import { useState } from 'react'
import Image from 'next/image'

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function Auth() {
  const [tab, setTab] = useState('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState('form')
  const [code, setCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!name || name.length < 2) { setError('Please enter a valid name'); return }
    if (!email.includes('@')) { setError('Please enter a valid email'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setError('')
    setLoading(true)

    const generatedCode = generateCode()
    setCode(generatedCode)

    const res = await fetch('/api/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: generatedCode })
    })

    setLoading(false)

    if (res.ok) {
      setSuccess(`Verification code sent to ${email}!`)
      setStep('verify')
    } else {
      setError('Failed to send email. Please try again.')
    }
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (inputCode === code) {
      setStep('success')
    } else {
      setError('Invalid verification code. Please try again.')
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    setError('')
    alert('Login successful!')
  }

  if (step === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 p-5">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 w-full max-w-md text-white text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
          <p className="text-slate-400 mb-6">Welcome to NorthStar, {name}!</p>
          <button onClick={() => window.location.href = '/dashboard'} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all">Go to Dashboard</button>
        </div>
      </main>
    )
  }

  if (step === 'verify') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 p-5">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 w-full max-w-md text-white">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-100">Verify Your Email</h2>
            <p className="text-slate-400 text-sm mt-2">We sent a 6-digit code to {email}</p>
          </div>
          {error && <div className="bg-red-500 text-white text-sm text-center py-3 px-4 rounded-lg mb-4">{error}</div>}
          {success && <div className="bg-green-500 text-white text-sm text-center py-3 px-4 rounded-lg mb-4">{success}</div>}
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Verification Code</label>
              <input type="text" placeholder="000000" maxLength={6} value={inputCode} onChange={e => setInputCode(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest"/>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all">Verify</button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 p-5">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 w-full max-w-md text-white">
        
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="NorthStar" width={90} height={90} className="rounded-2xl mx-auto mb-3"/>
          <h1 className="text-3xl font-bold text-slate-100">NorthStar</h1>
          <p className="text-slate-400 text-sm mt-1">Track goals, measure consistency, achieve results</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => setTab('signup')} className={`py-3 rounded-lg font-semibold text-sm transition-all ${tab === 'signup' ? 'bg-blue-600 text-white' : 'border border-slate-600 text-slate-400'}`}>Sign Up</button>
          <button onClick={() => setTab('login')} className={`py-3 rounded-lg font-semibold text-sm transition-all ${tab === 'login' ? 'bg-blue-600 text-white' : 'border border-slate-600 text-slate-400'}`}>Login</button>
        </div>

        {error && <div className="bg-red-500 text-white text-sm text-center py-3 px-4 rounded-lg mb-4">{error}</div>}

        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Full Name</label>
              <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Email Address</label>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Password</label>
              <input type="password" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Confirm Password</label>
              <input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all mt-2">
              {loading ? 'Sending code...' : 'Sign Up'}
            </button>
          </form>
        )}

        {tab === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Email</label>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Password</label>
              <input type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all mt-2">Login</button>
          </form>
        )}

      </div>
    </main>
  )
}