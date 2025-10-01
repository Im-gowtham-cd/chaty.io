import React from 'react'
import { useAuth } from '../hooks/useAuth'

export const DebugAuth: React.FC = () => {
  const { user, loading, session } = useAuth()

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Auth Debug Info</h2>
      <pre>
        {JSON.stringify({
          loading,
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          hasSession: !!session,
          sessionAge: session ? (Date.now() - new Date(session.created_at).getTime()) / 1000 + 's' : 'none'
        }, null, 2)}
      </pre>
      <button onClick={() => console.log('Full user:', user)}>Log User Details</button>
      <button onClick={() => console.log('Full session:', session)}>Log Session Details</button>
    </div>
  )
}