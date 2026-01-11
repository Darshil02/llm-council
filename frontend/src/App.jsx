import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { api } from './api';
import './App.css';

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load conversation details when selected
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);

      // If nothing is selected yet, auto-select the most recent conversation
      if (!currentConversationId && convs.length > 0) {
        setCurrentConversationId(convs[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation();
      setConversations((prev) => [
        { id: newConv.id, created_at: newConv.created_at, message_count: 0 },
        ...prev,
      ]);
      setCurrentConversationId(newConv.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleSendMessage = async (content) => {
    if (!currentConversationId) return;

    setIsLoading(true);

    try {
      const userMessage = { role: 'user', content };

      // 1) Safely add the user message
      setCurrentConversation((prev) => {
        const base =
          prev && Array.isArray(prev.messages)
            ? prev
            : { id: currentConversationId, messages: [] };

        return {
          ...base,
          messages: [...base.messages, userMessage],
        };
      });

      // 2) Create assistant placeholder
      const assistantMessage = {
        role: 'assistant',
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: {
          stage1: false,
          stage2: false,
          stage3: false,
        },
      };

      // 3) Safely add assistant placeholder
      setCurrentConversation((prev) => {
        const base =
          prev && Array.isArray(prev.messages)
            ? prev
            : { id: currentConversationId, messages: [userMessage] };

        return {
          ...base,
          messages: [...base.messages, assistantMessage],
        };
      });

      // 4) Stream events from backend
      await api.sendMessageStream(
        currentConversationId,
        content,
        (eventType, event) => {
          switch (eventType) {
            case 'stage1_start':
              setCurrentConversation((prev) => {
                if (!prev || !Array.isArray(prev.messages) || prev.messages.length === 0) {
                  return prev;
                }
                const messages = [...prev.messages];
                const lastMsg = messages[messages.length - 1];
                lastMsg.loading = lastMsg.loading || {};
                lastMsg.loading.stage1 = true;
                return { ...prev, messages };
              });
              break;

            case 'stage1_complete':
              setCurrentConversation((prev) => {
                if (!prev || !Array.isArray(prev.messages) || prev.messages.length === 0) {
                  return prev;
                }
                const messages = [...prev.messages];
                const lastMsg = messages[messages.length - 1];
                lastMsg.stage1 = event.data;
                lastMsg.loading = lastMsg.loading || {};
                lastMsg.loading.stage1 = false;
                return { ...prev, messages };
              });
              break;

            case 'stage2_start':
              setCurrentConversation((prev) => {
                if (!prev || !Array.isArray(prev.messages) || prev.messages.length === 0) {
                  return prev;
                }
                const messages = [...prev.messages];
                const lastMsg = messages[messages.length - 1];
                lastMsg.loading = lastMsg.loading || {};
                lastMsg.loading.stage2 = true;
                return { ...prev, messages };
              });
              break;

            case 'stage2_complete':
              setCurrentConversation((prev) => {
                if (!prev || !Array.isArray(prev.messages) || prev.messages.length === 0) {
                  return prev;
                }
                const messages = [...prev.messages];
                const lastMsg = messages[messages.length - 1];
                lastMsg.stage2 = event.data;
                lastMsg.metadata = event.metadata;
                lastMsg.loading = lastMsg.loading || {};
                lastMsg.loading.stage2 = false;
                return { ...prev, messages };
              });
              break;

            case 'stage3_start':
              setCurrentConversation((prev) => {
                if (!prev || !Array.isArray(prev.messages) || prev.messages.length === 0) {
                  return prev;
                }
                const messages = [...prev.messages];
                const lastMsg = messages[messages.length - 1];
                lastMsg.loading = lastMsg.loading || {};
                lastMsg.loading.stage3 = true;
                return { ...prev, messages };
              });
              break;

            case 'stage3_complete':
              setCurrentConversation((prev) => {
                if (!prev || !Array.isArray(prev.messages) || prev.messages.length === 0) {
                  return prev;
                }
                const messages = [...prev.messages];
                const lastMsg = messages[messages.length - 1];
                lastMsg.stage3 = event.data;
                lastMsg.loading = lastMsg.loading || {};
                lastMsg.loading.stage3 = false;
                return { ...prev, messages };
              });
              break;

            case 'title_complete':
              // Reload conversations to get updated title
              loadConversations();
              break;

            case 'complete':
              // Stream complete, reload conversations list
              loadConversations();
              setIsLoading(false);
              break;

            case 'error':
              console.error('Stream error:', event.message);
              setIsLoading(false);
              break;

            default:
              console.log('Unknown event type:', eventType);
          }
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Safely remove optimistic messages on error
      setCurrentConversation((prev) => {
        if (!prev || !Array.isArray(prev.messages)) return prev;
        const newMessages = prev.messages.slice(
          0,
          Math.max(0, prev.messages.length - 2)
        );
        return { ...prev, messages: newMessages };
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      <ChatInterface
        conversation={currentConversation}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;
