import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Chat, ChatMember } from '../types/database'
import { useAuth } from './useAuth'

export const useGroups = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadGroups()
      subscribeToGroups()
    }
  }, [user])

  const loadGroups = async () => {
    if (!user) return

    setLoading(true)
    
    const { data, error } = await supabase
      .from('chats')
      .select('*, chat_members(*)')
      .eq('type', 'group')
      .eq('chat_members.user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error loading groups:', error)
      return
    }

    setGroups(data || [])
    setLoading(false)
  }

  const subscribeToGroups = () => {
    if (!user) return

    const subscription = supabase
      .channel('groups')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `type=eq.group`
        },
        () => {
          loadGroups()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const createGroup = async (name: string, description: string, memberIds: string[]) => {
    if (!user) throw new Error('User not authenticated')

    const { data: group, error } = await supabase
      .from('chats')
      .insert({
        type: 'group',
        name,
        description,
        created_by: user.id,
        is_protected: false,
      })
      .select()
      .single()

    if (error) throw error

    const members = [user.id, ...memberIds].map(userId => ({
      chat_id: group.id,
      user_id: userId,
      role: userId === user.id ? 'owner' as const : 'member' as const
    }))

    const { error: membersError } = await supabase
      .from('chat_members')
      .insert(members)

    if (membersError) throw membersError

    return group
  }

  const updateGroup = async (groupId: string, updates: Partial<Chat>) => {
    const { error } = await supabase
      .from('chats')
      .update(updates)
      .eq('id', groupId)

    if (error) throw error
  }

  const addGroupMember = async (groupId: string, userId: string, role: 'admin' | 'member' = 'member') => {
    const { error } = await supabase
      .from('chat_members')
      .insert({
        chat_id: groupId,
        user_id: userId,
        role,
      })

    if (error) throw error
  }

  const removeGroupMember = async (groupId: string, userId: string) => {
    const { error } = await supabase
      .from('chat_members')
      .delete()
      .eq('chat_id', groupId)
      .eq('user_id', userId)

    if (error) throw error
  }

  const updateMemberRole = async (groupId: string, userId: string, role: 'owner' | 'admin' | 'member') => {
    const { error } = await supabase
      .from('chat_members')
      .update({ role })
      .eq('chat_id', groupId)
      .eq('user_id', userId)

    if (error) throw error
  }

  const leaveGroup = async (groupId: string) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('chat_members')
      .delete()
      .eq('chat_id', groupId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    addGroupMember,
    removeGroupMember,
    updateMemberRole,
    leaveGroup,
    refreshGroups: loadGroups,
  }
}