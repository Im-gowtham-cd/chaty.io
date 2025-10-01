import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Phone, Mail, Shield, User } from 'lucide-react'
import { LoadingSpinner } from '../Common/LoadingSpinner'
import './Login.css'

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Your specific test number
  const myTestNumber = '9003538951'
  const testOtp = '123456'

  const handleSendOtp = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      if (loginMethod === 'phone') {
        const fullPhoneNumber = `+91${phone.trim()}`
        
        // Check if it's your specific test number
        if (phone === myTestNumber) {
          setSuccess(`Test mode: Use OTP ${testOtp} for ${fullPhoneNumber}`)
          setIsOtpSent(true)
          return
        }
        
        // Check if it's a Supabase test number
        const isSupabaseTestNumber = phone.startsWith('500555')
        if (isSupabaseTestNumber) {
          const { error } = await supabase.auth.signInWithOtp({
            phone: `+1${phone.trim()}`,
          })

          if (error) throw error
          setSuccess(`Test OTP sent! Use: 123456`)
        } else {
          // Real phone number - will try to send real SMS
          const { error } = await supabase.auth.signInWithOtp({
            phone: fullPhoneNumber,
          })

          if (error) throw error
          setSuccess('OTP sent to your phone!')
        }
        
      } else {
        // Email auth
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
        })

        if (error) throw error
        setSuccess('Check your email for the login link!')
      }
      
      setIsOtpSent(true)
    } catch (error: any) {
      console.error('Error sending OTP:', error)
      setError(error.message || 'Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (loginMethod === 'email') {
      setError('For email, please check your email and click the magic link.')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      let fullPhoneNumber: string
      
      // Handle your specific test number
      if (phone === myTestNumber) {
        if (otp !== testOtp) {
          throw new Error(`For test number ${myTestNumber}, use OTP: ${testOtp}`)
        }
        
        // For your test number, we'll use a Supabase test number in the background
        fullPhoneNumber = '+15005550001'
      } else if (phone.startsWith('500555')) {
        // Supabase test numbers
        fullPhoneNumber = `+1${phone}`
      } else {
        // Real numbers
        fullPhoneNumber = `+91${phone}`
      }

      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhoneNumber,
        token: otp,
        type: 'sms',
      })

      if (error) throw error
      
      setSuccess('Login successful! Redirecting...')
    } catch (error: any) {
      console.error('Error verifying OTP:', error)
      
      if (error.message?.includes('invalid_otp')) {
        if (phone === myTestNumber) {
          setError(`For ${myTestNumber}, use OTP: ${testOtp}`)
        } else {
          setError('Invalid OTP. For test numbers, use: 123456')
        }
      } else {
        setError(error.message || 'Invalid OTP. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setIsOtpSent(false)
    setOtp('')
    setError('')
    setSuccess('')
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.slice(0, 10)
  }

  // Quick actions for test numbers
  const useMyTestNumber = () => {
    setPhone(myTestNumber)
    setError('')
    setSuccess('')
  }

  const useSupabaseTestNumber = (number: string) => {
    setPhone(number)
    setError('')
    setSuccess('')
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Shield className="logo-icon" />
          </div>
          <h1 className="login-title">Chatyio</h1>
          <p className="login-subtitle">Secure messaging with enhanced privacy</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Quick Test Buttons */}
        <div className="quick-test-buttons">
          <button 
            onClick={useMyTestNumber}
            className="quick-test-button primary-test"
          >
            <User className="test-icon" />
            Use My Test Number ({myTestNumber})
          </button>
          
          <button 
            onClick={() => useSupabaseTestNumber('5005550001')}
            className="quick-test-button"
          >
            Use Supabase Test Number
          </button>
        </div>

        <div className="login-method-toggle">
          <button
            onClick={() => setLoginMethod('phone')}
            className={`method-button ${loginMethod === 'phone' ? 'method-button-active' : ''}`}
          >
            <Phone className="method-icon" />
            Phone
          </button>
          <button
            onClick={() => setLoginMethod('email')}
            className={`method-button ${loginMethod === 'email' ? 'method-button-active' : ''}`}
          >
            <Mail className="method-icon" />
            Email
          </button>
        </div>

        {!isOtpSent ? (
          <div className="login-form">
            <div className="input-group">
              <label className="input-label">
                {loginMethod === 'phone' ? 'Phone Number' : 'Email Address'}
              </label>
              {loginMethod === 'phone' ? (
                <div className="phone-input-container">
                  <div className="country-code">
                    {phone === myTestNumber ? '+91' : phone.startsWith('500555') ? '+1' : '+91'}
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder={myTestNumber}
                    className="login-input phone-input"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="login-input"
                  disabled={isLoading}
                />
              )}
              
              {loginMethod === 'phone' && phone === myTestNumber && (
                <small className="input-hint success-hint">
                  ✅ Test mode: No SMS will be sent. Use OTP: <strong>{testOtp}</strong>
                </small>
              )}
            </div>
            
            <button
              onClick={handleSendOtp}
              disabled={isLoading || (loginMethod === 'phone' ? !phone.trim() : !email.trim())}
              className="login-button"
            >
              {isLoading ? <LoadingSpinner size="sm" color="white" /> : 
                loginMethod === 'phone' ? 'Send OTP' : 'Send Magic Link'}
            </button>
          </div>
        ) : (
          <div className="login-form">
            {loginMethod === 'phone' ? (
              <>
                <div className="input-group">
                  <label className="input-label">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder={phone === myTestNumber ? testOtp : "123456"}
                    className="login-input"
                    disabled={isLoading}
                  />
                  {phone === myTestNumber && (
                    <small className="input-hint success-hint">
                      For {myTestNumber}, use: <strong>{testOtp}</strong>
                    </small>
                  )}
                </div>
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || !otp.trim()}
                  className="login-button"
                >
                  {isLoading ? <LoadingSpinner size="sm" color="white" /> : 'Verify OTP'}
                </button>
              </>
            ) : (
              <div className="email-instructions">
                <p>📧 Check your email for a magic link</p>
              </div>
            )}
            
            <button onClick={handleBack} className="back-button">
              Back
            </button>
          </div>
        )}

        <div className="login-footer">
          <div className="test-info">
            <strong>Your Test Number:</strong> {myTestNumber} | <strong>OTP:</strong> {testOtp}
          </div>
        </div>
      </div>
    </div>
  )
}