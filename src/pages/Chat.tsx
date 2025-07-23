import React, { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Send, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatProps {
  websiteUrl?: string;
  productType?: string;
}

const Chat: React.FC<ChatProps> = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm here to help you improve your website and boost conversions. What specific area would you like to focus on today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I understand you want to improve that aspect. Based on best practices, here are some actionable recommendations I can help you implement...",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-white flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Sidebar */}
        <div className="w-full lg:w-1/2 xl:w-2/5 border-r border-[rgba(28,28,28,0.1)] flex flex-col">
          {/* Chat Header */}
          <div className="border-b border-[rgba(28,28,28,0.1)] p-4 bg-[rgba(247,244,237,1)]">
            <h2 className="text-[rgba(28,28,28,1)] text-lg font-medium">
              Website Optimization Assistant
            </h2>
            <p className="text-[rgba(95,95,93,1)] text-sm mt-1">
              Get personalized insights to improve your website
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-[rgba(28,28,28,1)]' 
                      : 'bg-[rgba(247,244,237,1)] border border-[rgba(28,28,28,0.2)]'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-[rgba(28,28,28,1)]" />
                    )}
                  </div>
                  <div className={`rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-[rgba(28,28,28,1)] text-white'
                      : 'bg-[rgba(247,244,237,1)] text-[rgba(28,28,28,1)] border border-[rgba(28,28,28,0.1)]'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-[rgba(247,244,237,1)] border border-[rgba(28,28,28,0.2)] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-[rgba(28,28,28,1)]" />
                  </div>
                  <div className="bg-[rgba(247,244,237,1)] border border-[rgba(28,28,28,0.1)] rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[rgba(95,95,93,1)] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[rgba(95,95,93,1)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[rgba(95,95,93,1)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-[rgba(28,28,28,0.1)] p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about conversion optimization, UX improvements, or analytics..."
                className="flex-1 bg-[rgba(247,244,237,1)] border border-[rgba(28,28,28,0.2)] rounded-lg px-4 py-2 text-[rgba(28,28,28,1)] placeholder-[rgba(95,95,93,1)] focus:outline-none focus:ring-2 focus:ring-[rgba(28,28,28,0.3)] focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-[rgba(28,28,28,1)] text-white hover:bg-[rgba(28,28,28,0.9)] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            
            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                "Improve conversion rate",
                "Analyze user behavior", 
                "Optimize checkout flow",
                "A/B test ideas"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputMessage(suggestion)}
                  className="bg-white border border-[rgba(28,28,28,0.2)] text-[rgba(28,28,28,1)] text-xs px-3 py-1 rounded-full hover:bg-[rgba(247,244,237,1)] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Preview/Analysis */}
        <div className="hidden lg:flex flex-1 bg-[rgba(252,251,248,1)] items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-[rgba(247,244,237,1)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-[rgba(28,28,28,1)]" />
            </div>
            <h3 className="text-[rgba(28,28,28,1)] text-xl font-medium mb-2">
              AI-Powered Insights
            </h3>
            <p className="text-[rgba(95,95,93,1)] text-sm leading-relaxed">
              Chat with our AI assistant to get personalized recommendations for improving your website's performance, user experience, and conversion rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;