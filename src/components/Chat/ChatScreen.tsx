import React, { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, MoreVertical } from 'lucide-react'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { MessageBubble } from './MessageBubble'
import { Header } from '../Common/Header'
import { LoadingSpinner } from '../Common/LoadingSpinner'
import './ChatScreen.css'

interface ChatScreenProps {
  chatId: string
  chatName: string
  onBack: () => void
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ chatId, chatName, onBack }) => {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, loading, sending, sendMessage } = useMessages(chatId)
  const { user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      await sendMessage(newMessage)
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="chat-screen-container">
      <Header 
        title={chatName} 
        showProfile={false}
        onProfileClick={onBack}
      />

      <div className="messages-container">
        <div className="messages-list">
          {messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={!!user && message.sender_id === user.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="message-input-container">
        <div className="message-input-wrapper">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="message-input"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="send-button"
          >
            {sending ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <Send className="send-icon" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}