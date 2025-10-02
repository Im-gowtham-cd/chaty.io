import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { Chat, ChatWithDetails } from '../types/database'
import { useAuth } from './useAuth'

export const useChat = () => {
  const { user } = useAuth()
  const [chats, setChats] = useState<ChatWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadChats()
      subscribeToChats()
    } else {
      setLoading(false)
      setChats([])
    }
  }, [user])

  const loadChats = async () => {
    if (!user) {
      setChats([])
      setLoading(false)
      return
    }

    console.log('Loading chats for user:', user.id)
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('chat_members')
        .select(`
          chat:chats(
            *,
            chat_members(
              *
            ),
            messages(
              *
            )
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('Error loading chats:', error)
        setError(error.message)
        setChats([])
        return
      }

      console.log('Raw chat data received:', data)

      const chatsWithDetails: ChatWithDetails[] = (data || [])
        .map(item => item.chat)
        .filter(chat => chat !== null)
        .map(chat => {
          const orderedMessages = (chat.messages || []).slice().sort((a: any, b: any) => (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ))
          return {
            ...chat,
            messages: orderedMessages,
            unread_count: calculateUnreadCount(orderedMessages, user.id)
          }
        })

      console.log('Processed chats:', chatsWithDetails)
      setChats(chatsWithDetails)
      
    } catch (error) {
      console.error('Error in loadChats:', error)
      setError('Failed to load chats')
      setChats([])
    } finally {
      console.log('loadChats finally block: setting loading to false')
      setLoading(false)
    }
  }

  const calculateUnreadCount = (messages: any[], userId: string): number => {
    return messages.filter(message => 
      message.sender_id !== userId
    ).length
  }

  const subscribeToChats = () => {
    if (!user) return

    console.log('Subscribing to chat changes for user:', user.id)

    const subscription = (supabaseAdmin as any)
      .channel(`chat_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_members',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Chat members changed:', payload)
          // Instead of reloading all chats, update the specific chat member
          setChats(prevChats => {
            const newChats = prevChats.map(chat => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const newMember = payload.new as any;
                if (chat.id === newMember.chat_id) {
                  // Check if member already exists to avoid duplicates
                  const memberExists = chat.chat_members.some(member => member.id === newMember.id);
                  if (!memberExists) {
                    return {
                      ...chat,
                      chat_members: [...chat.chat_members, newMember]
                    };
                  }
                }
              } else if (payload.eventType === 'DELETE') {
                const oldMember = payload.old as any;
                if (chat.id === oldMember.chat_id) {
                  return {
                    ...chat,
                    chat_members: chat.chat_members.filter(member => member.id !== oldMember.id)
                  };
                }
              }
              return chat;
            });
            return newChats;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Messages changed for chat list:', payload)
          // Update chat list when messages change in any chat this user is part of
          setChats(prevChats => {
            let matched = false
            const newChats = prevChats.map(chat => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const newMessage = payload.new as any;
                if (chat.id === newMessage.chat_id) {
                  matched = true
                  // Check if message already exists to avoid duplicates
                  const existingMessages = chat.messages || []
                  const messageExists = existingMessages.some(msg => msg.id === newMessage.id)
                  const updatedMessages = messageExists 
                    ? existingMessages.map(msg => msg.id === newMessage.id ? newMessage : msg)
                    : [...existingMessages, newMessage];
                  const orderedMessages = updatedMessages.slice().sort((a: any, b: any) => (
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  ))
                  return {
                    ...chat,
                    messages: orderedMessages,
                    unread_count: calculateUnreadCount(orderedMessages, user.id)
                  };
                }
              } else if (payload.eventType === 'DELETE') {
                const oldMessage = payload.old as any;
                if (chat.id === oldMessage.chat_id) {
                  matched = true
                  const updatedMessages = chat.messages ? chat.messages.filter(msg => msg.id !== oldMessage.id) : [];
                  const orderedMessages = updatedMessages.slice().sort((a: any, b: any) => (
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  ))
                  return {
                    ...chat,
                    messages: orderedMessages,
                    unread_count: calculateUnreadCount(orderedMessages, user.id)
                  };
                }
              }
              return chat;
            });
            // If message belongs to a chat we don't have yet, refresh the entire list
            if (!matched && payload.eventType === 'INSERT') {
              console.log('New message in unknown chat, refreshing chat list')
              loadChats()
            }
            return newChats;
          });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      console.log('Unsubscribing from chat changes')
      subscription.unsubscribe()
    }
  }

  const createChat = async (type: 'direct' | 'group', name: string, memberIds: string[]) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data: chat, error } = await supabase
        .from('chats')
        .insert({
          type,
          name: type === 'direct' ? null : name,
          created_by: user.id,
          is_protected: false,
        })
        .select()
        .single()

      if (error) throw error

      const members = [user.id, ...memberIds].map(userId => ({
        chat_id: chat.id,
        user_id: userId,
        role: userId === user.id ? 'owner' as const : 'member' as const
      }))

      const { error: membersError } = await supabase
        .from('chat_members')
        .insert(members)

      if (membersError) throw membersError

      await loadChats() // Refresh the list
      return chat
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  const deleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)

      if (error) throw error
      await loadChats() // Refresh the list
    } catch (error) {
      console.error('Error deleting chat:', error)
      throw error
    }
  }

  return {
    chats,
    loading,
    error,
    createChat,
    deleteChat,
    refreshChats: loadChats,
  }
}