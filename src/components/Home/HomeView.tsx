// Frontend Component 2: Conversation List Component
import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Plus } from 'lucide-react';

interface LastMessage {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: LastMessage | null;
  unreadCount: number;
  lastActivity: string;
  isOnline: boolean;
}

interface HomeViewProps {
  currentUserId: string;
  currentUserName: string;
  websocket: WebSocket | null;
  onConversationSelect: (conversationId: string, participantId: string, participantName: string) => void;
  onNewChat: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUserId,
  currentUserName,
  websocket,
  onConversationSelect,
  onNewChat
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Initialize conversations and set up real-time listeners
  useEffect(() => {
    if (!websocket) return;

    // Load initial conversations (mock data for demo)
    loadInitialConversations();

    // Set up real-time conversation update listener
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        handleRealTimeEvent(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.addEventListener('message', handleWebSocketMessage);

    return () => {
      websocket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [websocket, currentUserId]);

  const loadInitialConversations = () => {
    // Mock initial conversations - in real app, this would be an API call
    const mockConversations: Conversation[] = [
      {
        id: 'conv-1',
        participantId: 'user-2',
        participantName: 'Alice Johnson',
        participantAvatar: '/avatars/alice.jpg',
        lastMessage: {
          id: 'msg-1',
          content: 'Hey, how are you doing?',
          senderId: 'user-2',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        unreadCount: 2,
        lastActivity: new Date(Date.now() - 3600000).toISOString(),
        isOnline: true
      },
      {
        id: 'conv-2',
        participantId: 'user-3',
        participantName: 'Bob Smith',
        participantAvatar: '/avatars/bob.jpg',
        lastMessage: {
          id: 'msg-2',
          content: 'Thanks for the help yesterday!',
          senderId: 'user-1',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        unreadCount: 0,
        lastActivity: new Date(Date.now() - 7200000).toISOString(),
        isOnline: false
      }
    ];

    setConversations(mockConversations);
    setLoading(false);
  };

  const handleRealTimeEvent = (data: any) => {
    const { type, payload } = data;

    switch (type) {
      case 'CONVERSATION_UPDATE':
        // CRUCIAL: Real-time conversation list update
        handleConversationUpdate(payload);
        break;

      case 'NEW_MESSAGE':
        // Handle new message notification (update unread count)
        handleNewMessageNotification(payload);
        break;

      case 'CONNECTION_CONFIRMED':
        console.log('WebSocket connection confirmed for user:', payload.userId);
        break;

      default:
        // Ignore other event types in home view
        break;
    }
  };

  const handleConversationUpdate = (payload: any) => {
    const { conversationId, lastMessage, unreadCount, lastActivity } = payload;
    
    console.log('Real-time conversation update received:', {
      conversationId,
      lastMessage: lastMessage.content,
      unreadCount
    });

    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv => {
        if (conv.id === conversationId) {
          // Update existing conversation
          return {
            ...conv,
            lastMessage,
            unreadCount,
            lastActivity
          };
        }
        return conv;
      });

      // If conversation doesn't exist, create new one (for new chats)
      const conversationExists = prevConversations.some(conv => conv.id === conversationId);
      if (!conversationExists) {
        // In a real app, you'd fetch participant details from the server
        const newConversation: Conversation = {
          id: conversationId,
          participantId: lastMessage.senderId === currentUserId ? 'unknown' : lastMessage.senderId,
          participantName: 'New Contact', // Would be fetched from server
          lastMessage,
          unreadCount: lastMessage.senderId === currentUserId ? 0 : 1,
          lastActivity,
          isOnline: false
        };
        updatedConversations.push(newConversation);
      }

      // Sort conversations by last activity (most recent first)
      return updatedConversations.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    });

    // Show notification for new messages from others
    if (lastMessage.senderId !== currentUserId) {
      showNotification(lastMessage);
    }
  };

  const handleNewMessageNotification = (payload: any) => {
    const { message } = payload;
    
    // This handles direct message notifications that might not trigger conversation updates
    if (message.senderId !== currentUserId) {
      console.log('New message notification:', message.content);
      // Could trigger additional UI updates like sound, badge, etc.
    }
  };

  const showNotification = (message: LastMessage) => {
    // Show browser notification (if permissions granted)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Message', {
        body: message.content,
        icon: '/icon-192x192.png'
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="home-view-container">
        <div className="loading-container">
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-view-container">
      {/* Header */}
      <div className="home-header">
        <h1>Chatyio</h1>
        <div className="header-actions">
          <button onClick={onNewChat} className="new-chat-button">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome, {currentUserName}!</h2>
        <p>Your conversations will update in real-time</p>
      </div>

      {/* Conversations List */}
      <div className="conversations-container">
        {filteredConversations.length === 0 ? (
          <div className="empty-state">
            <MessageCircle size={48} className="empty-icon" />
            <h3>No conversations yet</h3>
            <p>Start a new chat to begin messaging</p>
            <button onClick={onNewChat} className="start-chat-button">
              Start New Chat
            </button>
          </div>
        ) : (
          <div className="conversations-list">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="conversation-item"
                onClick={() => onConversationSelect(
                  conversation.id,
                  conversation.participantId,
                  conversation.participantName
                )}
              >
                {/* Avatar */}
                <div className="conversation-avatar">
                  {conversation.participantAvatar ? (
                    <img
                      src={conversation.participantAvatar}
                      alt={conversation.participantName}
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {conversation.participantName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {conversation.isOnline && <div className="online-indicator" />}
                </div>

                {/* Conversation Info */}
                <div className="conversation-info">
                  <div className="conversation-header">
                    <h3 className="participant-name">
                      {conversation.participantName}
                    </h3>
                    <span className="last-activity">
                      {conversation.lastMessage && formatTime(conversation.lastMessage.timestamp)}
                    </span>
                  </div>
                  
                  <div className="conversation-preview">
                    <p className="last-message">
                      {conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.senderId === currentUserId && (
                            <span className="you-prefix">You: </span>
                          )}
                          {conversation.lastMessage.content}
                        </>
                      ) : (
                        'No messages yet'
                      )}
                    </p>
                    
                    {conversation.unreadCount > 0 && (
                      <div className="unread-badge">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// CSS Styles (would typically be in a separate .css file)
const styles = `
.home-view-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #25D366;
  color: white;
}

.home-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.new-chat-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-chat-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.search-container {
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #666;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 2rem;
  font-size: 1rem;
}

.welcome-section {
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
}

.welcome-section h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.welcome-section p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.conversations-container {
  flex: 1;
  overflow-y: auto;
}

.conversations-list {
  background: white;
}

.conversation-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background: #f8f8f8;
}

.conversation-avatar {
  position: relative;
  margin-right: 1rem;
}

.avatar-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #25D366;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4CAF50;
  border: 2px solid white;
  border-radius: 50%;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.participant-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  truncate: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.last-activity {
  font-size: 0.8rem;
  color: #666;
  flex-shrink: 0;
}

.conversation-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.you-prefix {
  color: #25D366;
  font-weight: 500;
}

.unread-badge {
  background: #25D366;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: #666;
}

.empty-icon {
  margin-bottom: 1rem;
  color: #ccc;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
}

.start-chat-button {
  background: #25D366;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 1rem;
}

.start-chat-button:hover {
  background: #128C7E;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
}
`;

export default HomeView;
