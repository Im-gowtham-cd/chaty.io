import React, { useState, useEffect } from 'react'
import { PasswordAuth } from './components/Auth/PasswordAuth'
import { ChatList } from './components/Chat/ChatList'
import { useAuth } from './hooks/useAuth'
import { LoadingSpinner } from './components/Common/LoadingSpinner'
import './App.css'

function App() {
  const { user, loading, session } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    // Check if user is authenticated on app start
    console.log('App - Auth State:', {
      user: user?.id,
      session: !!session,
      loading
    })

    // If user exists but no session, show auth screen
    if (!loading && !user) {
      setShowAuth(true)
    }
  }, [user, session, loading])

  const handleAuthSuccess = () => {
    console.log('Authentication successful, hiding auth screen')
    setShowAuth(false)
  }

  const handleSignOut = () => {
    // This will be triggered from child components
    setShowAuth(true)
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
    return <PasswordAuth onAuthSuccess={handleAuthSuccess} />
  }

  // User is authenticated - show main app
  console.log('User authenticated, showing ChatList')
  return <ChatList onSignOut={handleSignOut} />
}

export default App