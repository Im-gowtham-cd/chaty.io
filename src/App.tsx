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

  // Show auth screen if no user or explicitly showing auth
  if (!user || showAuth) {
    return (
      <PasswordAuth onAuthSuccess={handleAuthSuccess} />
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