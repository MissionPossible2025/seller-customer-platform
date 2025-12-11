import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/dailynk-logo.svg'

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
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      padding: '0 1.5rem'
    }}>
      <img
        src={logo}
        alt="DaiLynk logo"
        style={{ width: '220px', height: 'auto', objectFit: 'contain' }}
      />
    </div>
  )
}

