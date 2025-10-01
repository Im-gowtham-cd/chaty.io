import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { User, MessageCircle, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../Common/LoadingSpinner'
import { useNavigate } from 'react-router-dom'
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
  const [creatingChat, setCreatingChat] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      console.log('Loading users...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name', { ascending: true })

      if (error) {
        console.error('Error loading users:', error)
        throw error
      }

      console.log('Users loaded:', data?.length)
      
      // Filter out current user
      const filteredUsers = (data || [])
        .filter(profile => profile.id !== currentUser?.id)

      setUsers(filteredUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const startChat = async (targetUserId: string) => {
    if (!currentUser) return
    
    setCreatingChat(targetUserId)
    
    try {
      console.log('Starting chat with user:', targetUserId)
      
      // Check if direct chat already exists between these two users
      const { data: existingChats, error: chatError } = await supabase
        .from('chats')
        .select(`
          id,
          chat_members!inner(user_id)
        `)
        .eq('type', 'direct')
        .eq('chat_members.user_id', currentUser.id)

      if (chatError) {
        console.error('Error checking existing chats:', chatError)
        throw chatError
      }

      console.log('Existing chats:', existingChats)

      // If we have existing chats, check if any include the target user
      if (existingChats && existingChats.length > 0) {
        const chatIds = existingChats.map(chat => chat.id)
        
        const { data: targetChats, error: targetError } = await supabase
          .from('chat_members')
          .select('chat_id')
          .eq('user_id', targetUserId)
          .in('chat_id', chatIds)

        if (targetError) {
          console.error('Error checking target user chats:', targetError)
          throw targetError
        }

        console.log('Target user chats:', targetChats)

        // If chat exists, navigate to it
        if (targetChats && targetChats.length > 0) {
          const existingChatId = targetChats[0].chat_id
          console.log('Chat already exists:', existingChatId)
          navigate(`/chat/${existingChatId}`)
          return
        }
      }

      // Create new direct chat
      console.log('Creating new chat...')
      const { data: newChat, error: createError } = await supabaseAdmin
        .from('chats')
        .insert({
          type: 'direct',
          created_by: currentUser.id,
          is_protected: false,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating chat:', createError)
        // If duplicate chat prevented by constraint, locate the existing chat and navigate
        const message = (createError as any)?.message || ''
        const code = (createError as any)?.code || ''
        if (code === '23505' || message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('unique')) {
          console.log('Chat likely already exists, searching for existing direct chat between users')
          // Find common chat where both users are members and type is direct
          const { data: myChats, error: myChatsError } = await supabase
            .from('chat_members')
            .select('chat_id')
            .eq('user_id', currentUser.id)

          if (!myChatsError && myChats && myChats.length > 0) {
            const chatIds = myChats.map(c => c.chat_id)
            const { data: targetMemberships, error: targetMembershipsError } = await supabase
              .from('chat_members')
              .select('chat_id')
              .eq('user_id', targetUserId)
              .in('chat_id', chatIds)

            if (!targetMembershipsError && targetMemberships && targetMemberships.length > 0) {
              const existingChatId = targetMemberships[0].chat_id
              console.log('Navigating to existing chat:', existingChatId)
              navigate(`/chat/${existingChatId}`)
              return
            }
          }
        }
        throw createError
      }

      console.log('New chat created:', newChat)

      // Add both users to the chat
      const { error: membersError } = await supabaseAdmin
        .from('chat_members')
        .insert([
          {
            chat_id: newChat.id,
            user_id: currentUser.id,
            role: 'owner'
          },
          {
            chat_id: newChat.id,
            user_id: targetUserId,
            role: 'member'
          }
        ])

      if (membersError) {
        console.error('Error adding members:', membersError)
        throw membersError
      }

      console.log('Chat members added successfully')
      navigate(`/chat/${newChat.id}`)
      
      // Refresh the users list to show updated chat status
      loadUsers()
      
    } catch (error: any) {
      console.error('Error starting chat:', error)
      const message = error?.message || 'Unknown error'
      alert(`Failed to start chat: ${message}`)
    } finally {
      setCreatingChat(null)
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
        <button onClick={loadUsers} className="refresh-button">
          Refresh List
        </button>
      </div>

      <div className="search-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="users-stats">
        <p>Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="users-list">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <User className="empty-icon" />
            <h4>No users found</h4>
            <p>Try adjusting your search terms or refresh the list</p>
            <button onClick={loadUsers} className="refresh-button">
              Refresh Users
            </button>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div
              key={user.id}
              className="user-item"
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
                <p className="user-joined">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={() => startChat(user.id)}
                disabled={creatingChat === user.id}
                className="start-chat-button"
              >
                {creatingChat === user.id ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <MessageCircle className="chat-icon" />
                    Start Chat
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}