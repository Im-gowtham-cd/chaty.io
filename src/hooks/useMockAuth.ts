import { useState } from 'react'
import { supabase } from '../lib/supabase'

export const useMockAuth = () => {
  const [loading, setLoading] = useState(false)

  // Mock login for specific test numbers
  const mockSignInWithPhone = async (phone: string, otp: string) => {
    setLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Your specific test number
    if (phone === '9003538951' && otp === '123456') {
      // Create a mock session
      const mockUser = {
        id: 'mock-user-id',
        email: null,
        phone: '+919003538951',
        created_at: new Date().toISOString(),
      }
      
      // You'd need to handle this mock session in your app
      console.log('Mock login successful for:', phone)
      return { success: true, user: mockUser }
    }
    
    // For Supabase test numbers, use real auth
    if (phone.startsWith('500555')) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: `+1${phone}`,
          token: otp,
          type: 'sms',
        })
        
        if (error) throw error
        return { success: true, data }
      } catch (error) {
        return { success: false, error }
      }
    }
    
    setLoading(false)
    return { success: false, error: 'Invalid phone number for testing' }
  }

  return {
    loading,
    mockSignInWithPhone,
  }
}