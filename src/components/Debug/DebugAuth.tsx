import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'

export const DebugAuth: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)

  const testRegistration = async () => {
    try {
      console.log('Testing registration with:', { email, password })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('Registration result:', { data, error })
      setResult({ data, error })

      if (data?.user) {
        // Check if profile was created
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          console.log('Profile check:', profile)
          setResult(prev => ({ ...prev, profile }))
        }, 2000)
      }
    } catch (error) {
      console.error('Test error:', error)
      setResult({ error })
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Debug Auth</h2>
      <div>
        <input
          type="email"
          placeholder="test@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ margin: '5px', padding: '10px' }}
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ margin: '5px', padding: '10px' }}
        />
        <button onClick={testRegistration} style={{ margin: '5px', padding: '10px' }}>
          Test Registration
        </button>
      </div>
      {result && (
        <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}