import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <Image src="/logo.png" alt="NorthStar" width={150} height={150} style={{ borderRadius: '20px' }}/>
        <h1 style={{ fontSize: '2.5rem', margin: '20px 0 10px' }}>NorthStar</h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Track goals, measure consistency, achieve results</p>
        <Link href="/auth">
          <button style={{
            padding: '14px 40px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>Get Started</button>
        </Link>
      </div>
    </main>
  )
}