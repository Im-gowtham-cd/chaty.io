import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, MessageCircle, Users, Settings, User, Shield, Plus, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useChat } from '../../hooks/useChat'
import { Header } from '../Common/Header'
import { BottomNav } from '../Common/BottomNav'
import { LoadingSpinner } from '../Common/LoadingSpinner'
import './ChatList.css'

interface ChatListProps {
  onSignOut?: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onSignOut }) => {
  const { user, profile, signOut } = useAuth()
  const { chats, loading, refreshChats } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'contacts' | 'settings'>('chats')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    console.log('ChatList - Auth state:', { user: user?.id, profile: profile?.id })
    console.log('ChatList - Chats data:', { chatsCount: chats.length, loading })
  }, [user, profile, chats, loading])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshChats()
    setIsRefreshing(false)
  }

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages?.[0]?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateNewChat = () => {
    // For now, just refresh to see if we can load any data
    refreshChats()
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      onSignOut?.() // Notify parent component
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // If we have a user but chats are still loading
  if (loading && user) {
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
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    )
  }

  return (
    <div className="chat-list-container">
      <Header 
        title="Chatyio" 
        showSearch 
        onSearchChange={setSearchQuery}
      />

      <div className="chat-list-content">
        {/* Welcome Message */}
        <div className="welcome-section">
          <h2>Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}!</h2>
          <p>Start a new conversation or select an existing one.</p>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-button" onClick={handleCreateNewChat}>
            <Plus className="action-icon" />
            New Chat
          </button>
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
              {'Refresh'}
            </button>
          </div>

          {/* Conditional Chat List Rendering */}
          {(() => {
            if (filteredChats.length === 0) {
              return (
                <div className="empty-state">
                  <MessageCircle className="empty-icon" />
                  <h4>No conversations yet</h4>
                  <p>Start a new chat to begin messaging</p>
                  <button onClick={handleCreateNewChat} className="primary-button">
                    Start Your First Chat
                  </button>
                </div>
              )
            } else {
              return (
                <div className="chat-list">
                  {filteredChats.map(chat => (
                    <div
                      key={chat.id}
                      className="chat-item"
                      onClick={() => console.log('Navigate to chat:', chat.id)}
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
              )
            }
          })()}
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Settings Tab with Sign Out */}
      {activeTab === 'settings' && (
        <div className="settings-overlay">
          <div className="settings-content">
            <h3>Settings</h3>
            <button onClick={handleSignOut} className="sign-out-button">
              <LogOut className="icon" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
// UsersList component
const UsersList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, username')
      if (!error) setUsers(data || [])
      setLoadingUsers(false)
    }
    fetchUsers()
  }, [])

  if (loadingUsers) return <LoadingSpinner size="md" />

  return (
    <div className="users-list">
      {users.map(u => (
        <div key={u.id} className="user-item">
          <img src={u.avatar_url || '/default-avatar.png'} alt={u.display_name || u.username} className="user-avatar" />
          <span>{u.display_name || u.username}</span>
        </div>
      ))}
    </div>
  )
}
