import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

export const UserCreationTest: React.FC = () => {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('123456')
  const [result, setResult] = useState<any>(null)

  const testUserCreation = async () => {
    try {
      console.log('Testing user creation...')
      
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('Auth creation result:', { authData, authError })
      
      if (authError) throw authError
      if (!authData.user) throw new Error('No user returned')

      // Step 2: Wait and check if user exists in auth.users via admin
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Step 3: Try to create profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          display_name: 'Test User',
          is_verified: true
        })
        .select()
        .single()

      console.log('Profile creation result:', { profileData, profileError })
      
      setResult({
        auth: { data: authData, error: authError },
        profile: { data: profileData, error: profileError }
      })

    } catch (error) {
      console.error('Test error:', error)
      setResult({ error })
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>User Creation Test</h2>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="test@example.com"
          style={{ margin: '5px', padding: '10px' }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          style={{ margin: '5px', padding: '10px' }}
        />
        <button onClick={testUserCreation} style={{ margin: '5px', padding: '10px' }}>
          Test User Creation
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