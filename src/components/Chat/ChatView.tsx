// Frontend Component 1: Active Chat Component
import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'document';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatViewProps {
  conversationId: string;
  currentUserId: string;
  receiverId: string;
  receiverName: string;
  onBack: () => void;
  websocket: WebSocket | null;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversationId,
  currentUserId,
  receiverId,
  receiverName,
  onBack,
  websocket
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat: load history and set up real-time listeners
  useEffect(() => {
    if (!websocket || !conversationId) return;

    // Load message history
    loadMessageHistory();

    // Set up real-time message listener
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        handleRealTimeEvent(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.addEventListener('message', handleWebSocketMessage);

    // Join conversation for real-time updates
    websocket.send(JSON.stringify({
      type: 'JOIN_CONVERSATION',
      payload: { conversationId, userId: currentUserId }
    }));

    return () => {
      websocket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [websocket, conversationId, currentUserId]);

  const loadMessageHistory = () => {
    if (!websocket) return;

    setLoading(true);
    websocket.send(JSON.stringify({
      type: 'LOAD_HISTORY',
      payload: { conversationId, userId: currentUserId }
    }));
  };

  const handleRealTimeEvent = (data: any) => {
    const { type, payload } = data;

    switch (type) {
      case 'MESSAGE_HISTORY':
        // Initial message history loaded
        if (payload.conversationId === conversationId) {
          setMessages(payload.messages);
          setLoading(false);
          console.log(`Loaded ${payload.messages.length} messages for conversation`);
        }
        break;

      case 'NEW_MESSAGE':
        // Real-time new message received
        const newMsg = payload.message;
        if (newMsg.conversationId === conversationId) {
          setMessages(prev => {
            // Avoid duplicates
            const exists = prev.some(msg => msg.id === newMsg.id);
            if (exists) return prev;
            return [...prev, newMsg];
          });
          console.log('New message received in real-time:', newMsg.content);
        }
        break;

      case 'MESSAGE_SENT':
        // Confirmation that our message was sent
        const sentMsg = payload.message;
        if (sentMsg.conversationId === conversationId) {
          setMessages(prev => {
            // Update or add the sent message
            const exists = prev.some(msg => msg.id === sentMsg.id);
            if (exists) {
              return prev.map(msg => msg.id === sentMsg.id ? sentMsg : msg);
            }
            return [...prev, sentMsg];
          });
          setSending(false);
          console.log('Message sent confirmation received');
        }
        break;

      case 'CONVERSATION_JOINED':
        if (payload.conversationId === conversationId) {
          console.log('Successfully joined conversation');
        }
        break;

      default:
        // Ignore other event types in chat view
        break;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !websocket || sending) return;

    setSending(true);
    
    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      receiverId,
      content: newMessage.trim(),
      messageType: 'text',
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage.trim();
    setNewMessage('');

    // Send message to server
    websocket.send(JSON.stringify({
      type: 'SEND_MESSAGE',
      payload: {
        senderId: currentUserId,
        receiverId,
        conversationId,
        content: messageToSend,
        messageType: 'text'
      }
    }));

    console.log('Message sent to server:', messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="chat-view-container">
        <div className="chat-header">
          <button onClick={onBack} className="back-button">
            <ArrowLeft size={20} />
          </button>
          <h2>{receiverName}</h2>
        </div>
        <div className="loading-container">
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view-container">
      {/* Chat Header */}
      <div className="chat-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
        </button>
        <div className="receiver-info">
          <h2>{receiverName}</h2>
          <span className="online-status">Online</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        <div className="messages-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-bubble ${
                message.senderId === currentUserId ? 'own-message' : 'other-message'
              }`}
            >
              <div className="message-content">
                <p className="message-text">{message.content}</p>
                <div className="message-meta">
                  <span className="message-time">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.senderId === currentUserId && (
                    <span className={`message-status status-${message.status}`}>
                      {message.status === 'sent' && '✓'}
                      {message.status === 'delivered' && '✓✓'}
                      {message.status === 'read' && '✓✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <div className="input-wrapper">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="message-input"
            rows={1}
            disabled={sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="send-button"
          >
            {sending ? (
              <div className="sending-indicator">...</div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// CSS Styles (would typically be in a separate .css file)
const styles = `
.chat-view-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #25D366;
  color: white;
  gap: 1rem;
}

.back-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.receiver-info h2 {
  margin: 0;
  font-size: 1.1rem;
}

.online-status {
  font-size: 0.8rem;
  opacity: 0.8;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message-bubble {
  margin-bottom: 1rem;
  display: flex;
}

.own-message {
  justify-content: flex-end;
}

.other-message {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  position: relative;
}

.own-message .message-content {
  background: #DCF8C6;
  border-bottom-right-radius: 0.25rem;
}

.other-message .message-content {
  background: white;
  border-bottom-left-radius: 0.25rem;
}

.message-text {
  margin: 0 0 0.25rem 0;
  word-wrap: break-word;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  color: #666;
}

.message-status {
  color: #25D366;
}

.message-input-container {
  padding: 1rem;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 1.5rem;
  resize: none;
  font-family: inherit;
  max-height: 100px;
}

.send-button {
  background: #25D366;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.sending-indicator {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
`;

export default ChatView;
