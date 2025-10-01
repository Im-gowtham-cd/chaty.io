import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { User, MessageCircle, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../Common/LoadingSpinner'
import './UsersList.css'

interface UserProfile {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  status: string | null
  created_at: string
}

export const UsersList: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name', { ascending: true })

      if (error) throw error

      // Filter out current user and filter by search
      const filteredUsers = (data || [])
        .filter(profile => profile.id !== currentUser?.id)
        .filter(profile => 
          profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.phone?.includes(searchQuery)
        )

      setUsers(filteredUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const startChat = async (targetUserId: string) => {
    try {
      // Check if chat already exists
      const { data: existingChats, error: chatError } = await supabase
        .from('chat_members')
        .select('chat_id')
        .eq('user_id', currentUser?.id)

      if (chatError) throw chatError

      const existingChatIds = existingChats?.map(chat => chat.chat_id) || []

      const { data: targetUserChats, error: targetError } = await supabase
        .from('chat_members')
        .select('chat_id')
        .eq('user_id', targetUserId)
        .in('chat_id', existingChatIds)

      if (targetError) throw targetError

      // If chat exists, navigate to it
      if (targetUserChats && targetUserChats.length > 0) {
        console.log('Chat exists:', targetUserChats[0].chat_id)
        // Navigate to existing chat
        return
      }

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          type: 'direct',
          created_by: currentUser?.id,
          is_protected: false,
        })
        .select()
        .single()

      if (createError) throw createError

      // Add both users to chat
      const { error: membersError } = await supabase
        .from('chat_members')
        .insert([
          {
            chat_id: newChat.id,
            user_id: currentUser?.id,
            role: 'owner'
          },
          {
            chat_id: newChat.id,
            user_id: targetUserId,
            role: 'member'
          }
        ])

      if (membersError) throw membersError

      console.log('New chat created:', newChat.id)
      
    } catch (error) {
      console.error('Error starting chat:', error)
    }
  }

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery)
  )

  if (loading) {
    return (
      <div className="users-list-container">
        <div className="loading-container">
          <LoadingSpinner size="lg" />
          <p>Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="users-list-container">
      <div className="users-header">
        <h2>Available Users</h2>
        <p>Start a conversation with other users</p>
      </div>

      <div className="search-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="users-list">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <User className="empty-icon" />
            <h4>No users found</h4>
            <p>Try adjusting your search terms</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div
              key={user.id}
              className="user-item"
              onClick={() => startChat(user.id)}
            >
              <div className="user-avatar">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name || 'User'}
                    className="avatar-image"
                  />
                ) : (
                  <User className="avatar-icon" />
                )}
              </div>
              <div className="user-content">
                <h3 className="user-name">
                  {user.display_name || 'Unknown User'}
                </h3>
                <p className="user-info">
                  {user.email || user.phone || 'No contact info'}
                </p>
                {user.status && (
                  <p className="user-status">{user.status}</p>
                )}
              </div>
              <button className="start-chat-button">
                <MessageCircle className="chat-icon" />
                Chat
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}