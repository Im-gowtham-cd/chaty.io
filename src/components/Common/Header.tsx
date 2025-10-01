import React from 'react'
import { Search, User } from 'lucide-react'
import './Header.css'

interface HeaderProps {
  title?: string
  showSearch?: boolean
  showProfile?: boolean
  onSearchChange?: (query: string) => void
  onProfileClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Chatyio',
  showSearch = false,
  showProfile = true,
  onSearchChange,
  onProfileClick
}) => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">{title}</h1>
        <div className="header-actions">
          {showSearch && (
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="search-input"
              />
            </div>
          )}
          {showProfile && (
            <button className="profile-button" onClick={onProfileClick}>
              <User className="profile-icon" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}