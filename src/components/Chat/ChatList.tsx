import React, { useEffect, useState } from 'react'
import { MessageCircle, Users, Shield } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useChat } from '../../hooks/useChat'
import { Header } from '../Common/Header'
import { BottomNav } from '../Common/BottomNav'
import { LoadingSpinner } from '../Common/LoadingSpinner'
import { UsersList } from '../Users/UsersList'
import { useNavigate } from 'react-router-dom'
import './ChatList.css'

interface ChatListProps {
  onSignOut?: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onSignOut }) => {
  const { user, profile, signOut } = useAuth()
  const { chats, loading, refreshChats } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'chats' | 'users' | 'groups' | 'settings'>('chats')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('ChatList - Auth state:', { user: user?.id, profile: profile?.id })
    console.log('ChatList - Chats data:', { chatsCount: chats.length, loading })
  }, [user, profile, chats, loading])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshChats()
    setIsRefreshing(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      onSignOut?.()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages?.[0]?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // If we have a user but chats are still loading
  if (loading && user && activeTab === 'chats') {
    return (
      <div className="chat-list-container">
        <Header title="Chatyio" />
        <div className="loading-container">
          <LoadingSpinner size="lg" />
          <p>Loading your conversations...</p>
          <button onClick={handleRefresh} className="retry-button">
            Retry
          </button>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)} />
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chats':
        return (
          <div className="chat-list-content">
            {/* Welcome Message */}
            <div className="welcome-section">
              <h2>Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}!</h2>
              <p>Start a new conversation or select an existing one.</p>
            </div>

            {/* Chats List */}
            <div className="chats-section">
              <div className="section-header">
                <h3>Recent Conversations</h3>
                <button 
                  onClick={handleRefresh} 
                  disabled={isRefreshing}
                  className="refresh-button"
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {filteredChats.length === 0 ? (
                <div className="empty-state">
                  <MessageCircle className="empty-icon" />
                  <h4>No conversations yet</h4>
                  <p>Start chatting with other users</p>
                  <button 
                    onClick={() => setActiveTab('users')} 
                    className="primary-button"
                  >
                    Find Users to Chat With
                  </button>
                </div>
              ) : (
                <div className="chat-list">
                  {filteredChats.map(chat => (
                    <div
                      key={chat.id}
                      className="chat-item"
                      onClick={() => navigate(`/chat/${chat.id}`)}
                    >
                      <div className="chat-avatar">
                        {chat.avatar_url ? (
                          <img
                            src={chat.avatar_url}
                            alt={chat.name || 'Chat'}
                            className="avatar-image"
                          />
                        ) : (
                          <MessageCircle className="avatar-icon" />
                        )}
                      </div>
                      <div className="chat-content">
                        <div className="chat-header">
                          <h3 className="chat-name">
                            {chat.name || `Chat ${chat.id.slice(-4)}`}
                          </h3>
                          {chat.messages?.[0]?.created_at && (
                            <span className="chat-time">
                              {new Date(chat.messages[0].created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                        </div>
                        <p className="chat-preview">
                          {chat.messages?.[0]?.content || 'No messages yet'}
                        </p>
                      </div>
                      <div className="chat-indicators">
                        {chat.unread_count > 0 && (
                          <div className="unread-badge">
                            {chat.unread_count}
                          </div>
                        )}
                        {chat.is_protected && (
                          <Shield className="protected-icon" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      
      case 'users':
        return <UsersList />
      
      case 'groups':
        return (
          <div className="tab-content">
            <div className="empty-state">
              <Users className="empty-icon" />
              <h4>Group Chats</h4>
              <p>Group functionality coming soon!</p>
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="tab-content">
            <div className="settings-section">
              <h3>Settings</h3>
              <div className="settings-options">
                <div className="setting-item">
                  <strong>Account</strong>
                  <p>Manage your account settings</p>
                </div>
                <div className="setting-item">
                  <strong>Privacy</strong>
                  <p>Control your privacy settings</p>
                </div>
                <div className="setting-item">
                  <strong>Notifications</strong>
                  <p>Configure your notifications</p>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="sign-out-button"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="chat-list-container">
      <Header 
        title="Chatyio" 
        showSearch={activeTab === 'chats'}
        onSearchChange={setSearchQuery}
      />

      {renderTabContent()}

      <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)} />
    </div>
  )
}