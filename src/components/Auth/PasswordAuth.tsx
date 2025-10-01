import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { Shield, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import { LoadingSpinner } from '../Common/LoadingSpinner'
import './PasswordAuth.css'

interface PasswordAuthProps {
  onAuthSuccess: () => void;
}

export const PasswordAuth: React.FC<PasswordAuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Function to manually create profile using admin client
  const createUserProfile = async (userId: string, userEmail: string | undefined, userPhone: string | undefined, userDisplayName: string) => {
    try {
      console.log('Creating profile for user:', userId)
      
      // Use admin client to bypass RLS policies
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          phone: userPhone,
          display_name: userDisplayName,
          status: 'Hey there! I am using Chatyio',
          is_verified: true
        })
        .select()
        .single()

      if (error) {
        console.error('Profile creation error:', error)
        
        // If profile already exists, that's fine - just return
        if (error.code === '23505') {
          console.log('Profile already exists, continuing...')
          return { id: userId } // Return minimal profile data
        }
        
        throw error
      }

      console.log('Profile created successfully:', data)
      return data
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      // Don't throw error here - we still want to proceed with login
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        // LOGIN - Check against auth system
        console.log('Attempting login with:', { email, phone, password })
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email || undefined,
          phone: phone || undefined,
          password: password,
        })

        if (error) {
          console.error('Login error:', error)
          
          // Check if it's an invalid credentials error
          if (error.message?.includes('Invalid login credentials')) {
            // Verify if user exists in profiles table
            const identifier = email || (phone ? `+91${phone}` : null)
            if (!identifier) {
              throw new Error('Please provide email or phone number')
            }
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .or(`email.eq.${identifier},phone.eq.${identifier}`)
              .single()

            if (!profile) {
              throw new Error('Account not found. Please register first.')
            } else {
              throw new Error('Invalid password. Please try again.')
            }
          }
          
          throw error
        }

        console.log('Login successful:', data)
        setSuccess('Login successful!')
        
        // Notify parent component about successful auth
        setTimeout(() => {
          onAuthSuccess()
        }, 1000)

      } else {
        // REGISTRATION
        console.log('Attempting registration with:', { 
          email: email || 'none', 
          phone: phone || 'none', 
          displayName 
        })

        // Basic validation
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }

        if (!email && !phone) {
          throw new Error('Please provide either email or phone number')
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long')
        }

        if (!displayName.trim()) {
          throw new Error('Display name is required')
        }

        // Step 1: Create user in Supabase Auth
        console.log('Step 1: Creating auth user...')
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email || undefined,
          phone: phone || undefined,
          password: password,
          options: {
            data: {
              display_name: displayName,
            }
          }
        })

        if (authError) {
          console.error('Auth registration error:', authError)
          
          // If user already exists, try to login instead
          if (authError.message?.includes('User already registered')) {
            setError('Account already exists. Please login instead.')
            setIsLogin(true)
            return
          }
          
          throw authError
        }

        if (!authData.user) {
          throw new Error('User creation failed - no user returned')
        }

        console.log('✅ Auth user created:', authData.user.id)

        // Step 2: Create profile
        console.log('Step 2: Creating profile...')
        await createUserProfile(
          authData.user.id,
          email || undefined,
          phone ? `+91${phone}` : undefined,
          displayName
        )

        // Step 3: AUTO-LOGIN after registration
        console.log('Step 3: Auto-logging in...')
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email || undefined,
          phone: phone || undefined,
          password: password,
        })

        if (loginError) {
          console.error('Auto-login error:', loginError)
          // Even if auto-login fails, registration was successful
          setSuccess('Registration successful! Please login manually.')
          setIsLogin(true)
          return
        }

        console.log('✅ Auto-login successful:', loginData)
        setSuccess('Registration successful! Welcome to Chatyio.')
        
        // Notify parent component about successful auth
        setTimeout(() => {
          onAuthSuccess()
        }, 1000)
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setError(error.message || 'Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const clearForm = () => {
    setEmail('')
    setPhone('')
    setPassword('')
    setDisplayName('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
  }

  const switchToLogin = () => {
    setIsLogin(true)
    clearForm()
  }

  const switchToRegister = () => {
    setIsLogin(false)
    clearForm()
  }

  // Quick test data for development
  const useTestData = () => {
    if (isLogin) {
      setEmail('test@example.com')
      setPassword('123456')
    } else {
      setEmail('test@example.com')
      setPhone('9876543210')
      setDisplayName('Test User')
      setPassword('123456')
      setConfirmPassword('123456')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Shield className="logo-icon" />
          </div>
          <h1 className="auth-title">Chatyio</h1>
          <p className="auth-subtitle">Secure messaging with enhanced privacy</p>
        </div>

        {/* Quick test button for development */}
        <div className="dev-test-section">
          <button 
            onClick={useTestData}
            className="dev-test-button"
            type="button"
          >
            {isLogin ? 'Fill Test Login' : 'Fill Test Registration'}
          </button>
        </div>

        {/* Auth Toggle */}
        <div className="auth-toggle">
          <button
            onClick={switchToLogin}
            className={`toggle-button ${isLogin ? 'toggle-button-active' : ''}`}
            type="button"
          >
            Sign In
          </button>
          <button
            onClick={switchToRegister}
            className={`toggle-button ${!isLogin ? 'toggle-button-active' : ''}`}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="input-group">
              <label className="input-label">
                <User className="input-icon" />
                Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="auth-input"
                required={!isLogin}
                disabled={isLoading}
                minLength={2}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">
              <Mail className="input-icon" />
              Email {!isLogin && '(Optional)'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="auth-input"
              disabled={isLoading}
              required={isLogin && !phone}
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <Phone className="input-icon" />
              Phone {!isLogin && '(Optional)'}
            </label>
            <div className="phone-input-container">
              <div className="country-code">+91</div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                className="auth-input phone-input"
                disabled={isLoading}
                required={isLogin && !email}
              />
            </div>
            <small className="input-hint">
              {!isLogin ? 'Provide at least one: email or phone number' : 'Use email or phone to login'}
            </small>
          </div>

          <div className="input-group">
            <label className="input-label">
              <Lock className="input-icon" />
              Password *
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="auth-input password-input"
                required
                disabled={isLoading}
                minLength={6}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <small className="input-hint">
              Password must be at least 6 characters long
            </small>
          </div>

          {!isLogin && (
            <div className="input-group">
              <label className="input-label">
                <Lock className="input-icon" />
                Confirm Password *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="auth-input"
                required={!isLogin}
                disabled={isLoading}
                minLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="auth-button"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={isLogin ? switchToRegister : switchToLogin}
              className="auth-switch-button"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}