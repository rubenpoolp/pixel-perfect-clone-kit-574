import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, ExternalLink, BarChart3, Users, ShoppingCart, Navigation, ArrowLeft, ArrowRight, RotateCcw, Link } from 'lucide-react';
import { AnalysisService } from '@/services/AnalysisService';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
  pageContext?: string;
}

interface WebsiteData {
  websiteUrl: string;
  productType: string;
}

interface ChatProps {
  websiteUrl?: string;
  productType?: string;
}

let messageIdCounter = 1;

const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${messageIdCounter++}-${Math.random().toString(36).substr(2, 9)}`;
};

const Chat: React.FC<ChatProps> = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [currentPageUrl, setCurrentPageUrl] = useState<string>('');
  const [currentPageName, setCurrentPageName] = useState<string>('Homepage');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const extractPageName = useCallback((url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/').filter(Boolean);
      
      if (segments.length === 0) return 'Homepage';
      
      const lastSegment = segments[segments.length - 1];
      const pageNames: { [key: string]: string } = {
        'pricing': 'Pricing',
        'about': 'About',
        'contact': 'Contact',
        'products': 'Products',
        'services': 'Services',
        'blog': 'Blog',
        'features': 'Features',
        'support': 'Support',
        'login': 'Login',
        'signup': 'Signup',
        'cart': 'Cart',
        'checkout': 'Checkout'
      };
      
      return pageNames[lastSegment.toLowerCase()] || 
             lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    } catch {
      return 'Homepage';
    }
  }, []);

  const getInitialSuggestions = useCallback((productType: string): string[] => {
    const suggestions: { [key: string]: string[] } = {
      'ecommerce': [
        "What can I improve on this page to increase conversions?",
        "How does this page compare to top ecommerce sites?",
        "What are the biggest conversion barriers here?",
        "How can I optimize this page for mobile users?"
      ],
      'saas': [
        "How can I improve the conversion rate on this page?",
        "What do industry leaders do better on similar pages?",
        "What elements should I A/B test here?",
        "How can I reduce friction on this page?"
      ],
      'blog': [
        "How can I increase engagement on this content?",
        "What's missing compared to top performing blogs?",
        "How can I improve the user experience here?",
        "What should I optimize for better SEO?"
      ],
      'portfolio': [
        "How can I make this page more compelling?",
        "What do successful portfolios do differently?",
        "How can I improve trust signals here?",
        "What would make visitors contact me from this page?"
      ]
    };
    
    return suggestions[productType] || [
      "What should I improve on this page?",
      "How does this compare to competitors?",
      "What are the biggest issues you see here?",
      "How can I optimize this page for conversions?"
    ];
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: generateUniqueId(message.sender)
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  useEffect(() => {
    // Get website data from localStorage
    const storedData = localStorage.getItem('websiteData');
    if (storedData) {
      const data: WebsiteData = JSON.parse(storedData);
      setWebsiteData(data);
      
      // Check if there's a page parameter in URL
      const pageParam = searchParams.get('page');
      let initialUrl = data.websiteUrl;
      let initialPageName = 'Homepage';
      
      // If page param exists and is not about:blank, use it
      if (pageParam && pageParam !== 'about:blank' && pageParam.startsWith('http')) {
        initialUrl = decodeURIComponent(pageParam);
        initialPageName = extractPageName(initialUrl);
      }
      
      setCurrentPageUrl(initialUrl);
      setCurrentPageName(initialPageName);
      
      // Update URL to match the current page
      setSearchParams({ page: initialUrl });
      
      // Create personalized first message
      addMessage({
        content: `👋 **Welcome! I'm Jackie, your AI website optimization expert.**\n\nI've analyzed your website and I'm ready to give you personalized, actionable insights that can immediately improve your conversions and user experience.\n\n**Currently analyzing:** ${initialPageName} on ${new URL(data.websiteUrl).hostname}\n\nI can help you identify conversion barriers, UX improvements, and growth opportunities that your competitors might be missing.\n\n**What would you like to optimize first?**`,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: getInitialSuggestions(data.productType),
        pageContext: initialPageName
      });
    } else {
      // No website data found, redirect to add website page
      addMessage({
        content: `⚠️ **No website data found!** Please add your website first to start getting insights.`,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: ['Add my website', 'Go back to setup']
      });
    }
  }, [searchParams, setSearchParams, extractPageName, getInitialSuggestions, addMessage]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !websiteData) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    addMessage({
      content: userMessage,
      sender: 'user',
      timestamp: new Date(),
      pageContext: currentPageName
    });

    try {
      // Use AnalysisService which handles both real AI and fallback
      const analysis = await AnalysisService.analyzeWebsite({
        websiteUrl: websiteData.websiteUrl,
        currentPage: currentPageName,
        productType: websiteData.productType,
        userQuestion: userMessage
      });

      addMessage({
        content: analysis.content,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: analysis.suggestions,
        pageContext: currentPageName
      });

      // Mark that the user has asked their first question
      setHasAskedQuestion(true);
    } catch (error) {
      console.error('Error getting AI response:', error);
      addMessage({
        content: 'Sorry, I encountered an error while analyzing your website. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        suggestions: ['Try again', 'Ask a different question', 'Check your connection'],
        pageContext: currentPageName
      });
      
      toast({
        title: "Analysis Error",
        description: "Failed to get AI insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, currentPageName, websiteData, addMessage, toast]);

  const navigateToPage = useCallback((url: string) => {
    // Clean up URL to prevent double slashes and other issues
    let cleanUrl = url.trim();
    
    // Fix double slashes in path (except after protocol)
    cleanUrl = cleanUrl.replace(/([^:]\/)\/+/g, '$1');
    
    // Ensure URL starts with protocol
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    setCurrentPageUrl(cleanUrl);
    const pageName = extractPageName(cleanUrl);
    setCurrentPageName(pageName);
    
    // Update URL with page parameter
    setSearchParams({ page: cleanUrl });
    
    // Add context message
    addMessage({
      content: `📍 Navigated to **${pageName}** page. I'm now analyzing this specific page and can provide targeted insights for optimization.`,
      sender: 'ai',
      timestamp: new Date(),
      pageContext: pageName
    });
  }, [extractPageName, setSearchParams, addMessage]);

  return (
    <div className="bg-neutral-900 flex flex-col h-screen text-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat Interface (30% width, Lovable-style) */}
        <div className="w-full md:w-[30%] flex flex-col bg-neutral-900 border-r border-neutral-700">
          {/* Chat Header - Lovable Style */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-700">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-gray-400" />
              <h1 className="text-gray-200 text-lg font-medium">{websiteData ? new URL(websiteData.websiteUrl).hostname : 'No website'}</h1>
            </div>
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 hover:bg-neutral-800 rounded-lg"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {showDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg z-50">
                  <ul className="py-2">
                    <li>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate('/add-website');
                        }}
                        className="w-full text-left px-4 py-2 text-gray-200 hover:bg-neutral-700 transition-colors"
                      >
                        Change Website
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                {message.sender === 'ai' && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <div className="w-4 h-4 text-yellow-500">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span>Thought for a few seconds</span>
                  </div>
                )}
                
                <div className="text-gray-100 leading-relaxed whitespace-pre-line">
                  {message.content}
                </div>

                {/* Suggestions for AI messages */}
                {message.sender === 'ai' && message.suggestions && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={`${message.id}-suggestion-${index}`}
                        onClick={() => setInputMessage(suggestion)}
                        className="bg-neutral-800 border border-neutral-600 text-gray-200 text-xs px-3 py-1.5 rounded-full hover:bg-neutral-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <div className="w-4 h-4 text-yellow-500">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Thought for a few seconds</span>
                </div>
                
                <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 max-w-fit">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Lovable Style */}
          <div className="p-4 border-t border-neutral-700">
            {hasAskedQuestion ? (
              <div className="space-y-4">
                <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 text-center">
                  <p className="text-gray-200 mb-3">For more detailed insights and personalized recommendations</p>
                  <Button 
                    onClick={() => window.open('https://calendly.com/jackie-ai', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Request a Demo
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask Jackie..."
                  className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Panel - Website Preview (70% width) */}
        <div className="flex flex-1 bg-neutral-900 flex-col">
          {websiteData ? (
            <div className="flex flex-col h-full">
              {/* Website Controls */}
              <div className="bg-neutral-800 border-b border-neutral-700 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-200">{currentPageName}</span>
                    <span className="bg-neutral-700 text-gray-300 px-2 py-1 rounded text-xs">
                      {websiteData.productType}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => iframeRef.current?.contentWindow?.history.back()}
                      className="p-1 hover:bg-neutral-700 rounded"
                      title="Go Back"
                    >
                      <ArrowLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => iframeRef.current?.contentWindow?.history.forward()}
                      className="p-1 hover:bg-neutral-700 rounded"
                      title="Go Forward"
                    >
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => iframeRef.current?.contentWindow?.location.reload()}
                      className="p-1 hover:bg-neutral-700 rounded"
                      title="Reload"
                    >
                      <RotateCcw className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                    <span>Copy paste the link of the page you want insights on</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={currentPageUrl}
                      onChange={(e) => setCurrentPageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          navigateToPage(currentPageUrl);
                        }
                      }}
                      className="flex-1 text-sm bg-neutral-700 border-2 border-blue-500 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
                      placeholder="Paste page URL here..."
                    />
                    <button
                      onClick={() => navigateToPage(currentPageUrl)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                    >
                      ANALYZE
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Website Preview */}
              <div className="flex-1 p-4">
                <div className="w-full h-full bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    src={currentPageUrl}
                    className="w-full h-full"
                    title="Website Preview"
                    allow="navigation-top"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-200 text-lg font-medium mb-2">
                  Website Preview
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Add your website URL to start getting AI-powered insights and recommendations.
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