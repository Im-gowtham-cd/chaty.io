import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { Message } from '../types/database'
import { useAuth } from './useAuth'

export const useMessages = (chatId: string) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (chatId) {
      loadMessages()
      subscribeToMessages()
    }
  }, [chatId])

  const loadMessages = async () => {
    if (!chatId) return

    setLoading(true)
    
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*, profiles(*)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
      return
    }

    setMessages(data || [])
    setLoading(false)
  }

  const subscribeToMessages = () => {
    if (!chatId) return

    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as Message])
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? payload.new as Message : msg
            ))
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'video' | 'document' | 'audio' = 'text', mediaUrl: string | null = null) => {
    if (!user || !chatId || !content.trim()) return

    setSending(true)
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content: content.trim(),
        message_type: messageType,
        media_url: mediaUrl,
        is_hidden: false,
        deleted_for_all: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      setSending(false)
      throw error
    }

    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId)

    setSending(false)
    return data
  }

  const deleteMessage = async (messageId: string, deleteForAll: boolean = false) => {
    if (deleteForAll) {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_for_all: true })
        .eq('id', messageId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('messages')
        .update({ is_hidden: true, hidden_by: user?.id })
        .eq('id', messageId)

      if (error) throw error
    }
  }

  const editMessage = async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ 
        content: newContent,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)

    if (error) throw error
  }

  return {
    messages,
    loading,
    sending,
    sendMessage,
    deleteMessage,
    editMessage,
    refreshMessages: loadMessages,
  }
}