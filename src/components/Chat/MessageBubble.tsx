import React from 'react'
import { Message } from '../../types/database'
import { formatTime } from '../../utils/helpers'
import './MessageBubble.css'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  return (
    <div className={`message-bubble ${isOwn ? 'message-own' : 'message-other'}`}>
      <div className="message-content">
        <p className="message-text">{message.content}</p>
        <div className="message-meta">
          <span className="message-time">
            {formatTime(message.created_at)}
          </span>
          {message.edited_at && (
            <span className="message-edited">(edited)</span>
          )}
        </div>
      </div>
    </div>
  )
}