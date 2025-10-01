import React from 'react'
import './LoadingSpinner.css'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}) => {
  return (
    <div className={`loading-spinner loading-spinner-${size} loading-spinner-${color} ${className}`}>
      <div className="spinner"></div>
    </div>
  )
}