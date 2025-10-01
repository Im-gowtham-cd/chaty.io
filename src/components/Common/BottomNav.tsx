import React from 'react'
import { MessageCircle, Users, User, Settings } from 'lucide-react'
import './BottomNav.css'

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'groups', icon: User, label: 'Groups' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon className="nav-icon" />
            <span className="nav-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}