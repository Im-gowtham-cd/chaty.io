export interface Profile {
  id: string
  email: string
  phone: string | null
  display_name: string | null
  avatar_url: string | null
  status: string | null
  created_at: string
  updated_at: string
}

export interface Chat {
  id: string
  type: 'direct' | 'group'
  name: string | null
  description: string | null
  avatar_url: string | null
  created_by: string
  is_protected: boolean
  password_hash: string | null
  created_at: string
  updated_at: string
}

export interface ChatMember {
  id: string
  chat_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'video' | 'document' | 'audio'
  media_url: string | null
  reply_to: string | null
  is_hidden: boolean
  hidden_by: string | null
  deleted_for_all: boolean
  edited_at: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface MessageStatus {
  id: string
  message_id: string
  user_id: string
  status: 'sent' | 'delivered' | 'read'
  updated_at: string
}

export interface HiddenMessage {
  id: string
  message_id: string
  user_id: string
  hidden_at: string
}

export type ChatWithDetails = Chat & {
  chat_members: (ChatMember & { profiles?: Profile })[]
  messages: Message[]
  unread_count: number
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Profile>
      }
      chats: {
        Row: Chat
        Insert: Omit<Chat, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Chat>
      }
      chat_members: {
        Row: ChatMember
        Insert: Omit<ChatMember, 'id' | 'joined_at'>
        Update: Partial<ChatMember>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Message>
      }
      message_status: {
        Row: MessageStatus
        Insert: Omit<MessageStatus, 'id' | 'updated_at'>
        Update: Partial<MessageStatus>
      }
      hidden_messages: {
        Row: HiddenMessage
        Insert: Omit<HiddenMessage, 'id' | 'hidden_at'>
        Update: Partial<HiddenMessage>
      }
    }
  }
}