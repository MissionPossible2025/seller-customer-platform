import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SplashScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      // After splash, go straight to dashboard
      navigate('/dashboard', { replace: true })
    }, 2000) // 2 seconds splash

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '0 1.5rem',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <span
        style={{
          fontSize: '3rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: '#0f172a'
        }}
      >
        DAILYNK
      </span>
    </div>
  )
}

