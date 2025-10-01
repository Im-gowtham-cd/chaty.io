import React, { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
const PasswordAuth = lazy(() => import('./components/Auth/PasswordAuth').then(m => ({ default: m.PasswordAuth })))
import { ChatList } from './components/Chat/ChatList'
import { ChatScreen } from './components/Chat/ChatScreen'
import { useAuth } from './hooks/useAuth'
import { LoadingSpinner } from './components/Common/LoadingSpinner'
import './App.css'

function App() {
  const { user, loading, session } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is authenticated on app start
    console.log('App - Auth State:', {
      user: user?.id,
      session: !!session,
      loading
    })

    // If user exists but no session, show auth screen
    if (!loading && !user) {
      setShowAuth(false)
    }
  }, [user, session, loading])

  const handleAuthSuccess = () => {
    console.log('Authentication successful, hiding auth screen')
    setShowAuth(false)
    navigate('/')
  }

  const handleSignOut = () => {
    // This will be triggered from child components
    setShowAuth(false)
  }

  // Show loading spinner only during initial auth check
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="loading-logo">
            <LoadingSpinner size="lg" color="primary" />
          </div>
          <p className="loading-text">Loading Chatyio...</p>
        </div>
      </div>
    )
  }

  // Show auth screen if no user or explicitly showing auth
  if (!user || showAuth) {
    return (
      <Suspense fallback={
        <div className="app-loading">
          <div className="loading-content">
            <div className="loading-logo">
              <LoadingSpinner size="lg" color="primary" />
            </div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      }>
        <PasswordAuth onAuthSuccess={handleAuthSuccess} />
      </Suspense>
    )
  }

  // User is authenticated - show routes
  console.log('User authenticated, showing routes')
  return (
    <Routes>
      <Route path="/" element={<ChatList onSignOut={handleSignOut} />} />
      <Route path="/chat/:chatId" element={<ChatRouteWrapper />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

// Small wrapper to extract params and pass to ChatScreen
function ChatRouteWrapper() {
  const params = useParams()
  const navigate = useNavigate()
  const chatId = params.chatId as string
  return (
    <ChatScreen 
      chatId={chatId}
      chatName={"Chat"}
      onBack={() => navigate('/')}
    />
  )
}