import { useState } from 'react'
import { supabase } from '../lib/supabase'

export const useCustomAuth = () => {
  const [loading, setLoading] = useState(false)

  const signInWithEmail = async (email: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) throw error
      
      return { success: true }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const verifyEmailOTP = async (email: string, token: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (error) throw error
      
      return { success: true, data }
    } catch (error: any) {
      console.error('OTP verification error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    signInWithEmail,
    verifyEmailOTP,
  }
}