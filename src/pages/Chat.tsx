import React, { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, ExternalLink, BarChart3, Users, ShoppingCart } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
}

interface WebsiteData {
  websiteUrl: string;
  productType: string;
}

interface ChatProps {
  websiteUrl?: string;
  productType?: string;
}

const Chat: React.FC<ChatProps> = () => {
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get website data from localStorage
    const storedData = localStorage.getItem('websiteData');
    if (storedData) {
      const data: WebsiteData = JSON.parse(storedData);
      setWebsiteData(data);
      
      // Create personalized first message
      const welcomeMessage: Message = {
        id: '1',
        content: `Great! I've analyzed your ${data.productType} website at **${data.websiteUrl}**. I'm here to help you optimize it for better performance and conversions.\n\nBased on your ${data.productType} type, here are some key areas we can focus on:`,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: getInitialSuggestions(data.productType)
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const getInitialSuggestions = (productType: string): string[] => {
    const suggestions: { [key: string]: string[] } = {
      'ecommerce': [
        "Analyze cart abandonment rates",
        "Optimize product page conversions", 
        "Improve checkout flow",
        "Review mobile shopping experience"
      ],
      'saas': [
        "Optimize signup conversion funnel",
        "Analyze free trial to paid conversions",
        "Improve onboarding experience",
        "Review pricing page effectiveness"
      ],
      'blog': [
        "Increase content engagement",
        "Optimize for SEO",
        "Improve newsletter signups",
        "Analyze reader retention"
      ],
      'portfolio': [
        "Optimize contact form conversions",
        "Improve project showcase",
        "Enhance personal branding",
        "Analyze visitor engagement"
      ]
    };
    
    return suggestions[productType] || [
      "Analyze user behavior patterns",
      "Improve conversion rates",
      "Optimize page load speeds",
      "Enhance user experience"
    ];
  };

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

    // Simulate AI response with website-specific insights
    setTimeout(() => {
      let aiResponse = "I understand you want to improve that aspect. ";
      
      if (websiteData) {
        aiResponse += `For your ${websiteData.productType} website (${websiteData.websiteUrl}), here are some specific recommendations:\n\n`;
        
        if (websiteData.productType === 'ecommerce') {
          aiResponse += "• **Product Page Optimization**: Add trust badges, customer reviews, and clear CTAs\n• **Cart Recovery**: Implement abandoned cart email sequences\n• **Mobile Experience**: Ensure seamless mobile checkout process";
        } else if (websiteData.productType === 'saas') {
          aiResponse += "• **Trial Optimization**: Reduce signup friction and provide instant value\n• **Feature Highlighting**: Use progressive disclosure to showcase key benefits\n• **Social Proof**: Add customer testimonials and usage statistics";
        } else {
          aiResponse += "• **Performance Audit**: Check page load speeds and Core Web Vitals\n• **Content Strategy**: Optimize for user intent and engagement\n• **Conversion Points**: Identify and optimize key conversion opportunities";
        }
      } else {
        aiResponse += "Based on best practices, here are some actionable recommendations I can help you implement...";
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
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
        {/* Left Panel - Chat Interface (30% width, dark mode) */}
        <div className="w-full md:w-[30%] flex flex-col bg-gray-900 border-r border-gray-700">
          {/* Chat Header */}
          <div className="border-b border-gray-700 p-4 bg-gray-800">
            <h2 className="text-white text-lg font-medium">
              Website Optimization Assistant
            </h2>
            <p className="text-gray-300 text-sm mt-1">
              Get personalized insights to improve your website
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' 
                        ? 'bg-blue-600' 
                        : 'bg-gray-700 border border-gray-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-100 border border-gray-700'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>
                </div>
                
                {/* Suggestions for AI messages */}
                {message.sender === 'ai' && message.suggestions && (
                  <div className="ml-10 mt-2 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(suggestion)}
                        className="bg-gray-800 border border-gray-600 text-gray-200 text-xs px-3 py-1 rounded-full hover:bg-gray-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-700 p-4 bg-gray-900">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about conversion optimization, UX improvements, or analytics..."
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            
            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-2 mt-3">
              {websiteData ? getInitialSuggestions(websiteData.productType).slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputMessage(suggestion)}
                  className="bg-gray-800 border border-gray-600 text-gray-200 text-xs px-3 py-1 rounded-full hover:bg-gray-700 transition-colors"
                >
                  {suggestion}
                </button>
              )) : [
                "Improve conversion rate",
                "Analyze user behavior", 
                "Optimize checkout flow"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputMessage(suggestion)}
                  className="bg-gray-800 border border-gray-600 text-gray-200 text-xs px-3 py-1 rounded-full hover:bg-gray-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Website Preview (70% width) */}
        <div className="flex flex-1 bg-[rgba(252,251,248,1)] flex-col">
          {websiteData ? (
            <div className="flex flex-col h-full">
              {/* Website Info Header */}
              <div className="bg-white border-b border-[rgba(28,28,28,0.1)] p-4">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[rgba(95,95,93,1)]" />
                  <span className="text-[rgba(28,28,28,1)] font-medium">{websiteData.websiteUrl}</span>
                  <span className="bg-[rgba(247,244,237,1)] text-[rgba(95,95,93,1)] px-2 py-1 rounded text-xs">
                    {websiteData.productType}
                  </span>
                </div>
              </div>
              
              {/* Website Preview */}
              <div className="flex-1 p-4">
                <div className="w-full h-full bg-white rounded-lg border border-[rgba(28,28,28,0.1)] overflow-hidden">
                  <iframe
                    src={websiteData.websiteUrl}
                    className="w-full h-full"
                    title="Website Preview"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                  />
                </div>
              </div>
              
              {/* Quick Analysis Panel */}
              <div className="bg-white border-t border-[rgba(28,28,28,0.1)] p-4 max-h-48 overflow-y-auto">
                <h3 className="text-[rgba(28,28,28,1)] text-sm font-medium mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Key Focus Areas
                </h3>
                <div className="space-y-1">
                  {getInitialSuggestions(websiteData.productType).slice(0, 3).map((area, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-[rgba(95,95,93,1)]">
                      <div className="w-1.5 h-1.5 bg-[rgba(28,28,28,1)] rounded-full"></div>
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-[rgba(247,244,237,1)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-[rgba(28,28,28,1)]" />
                </div>
                <h3 className="text-[rgba(28,28,28,1)] text-lg font-medium mb-2">
                  Website Preview
                </h3>
                <p className="text-[rgba(95,95,93,1)] text-sm leading-relaxed">
                  Your website preview will appear here once you add a website URL.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;