import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, ExternalLink, BarChart3, Users, ShoppingCart, Navigation, ArrowLeft, ArrowRight, RotateCcw, Link } from 'lucide-react';

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

const Chat: React.FC<ChatProps> = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [currentPageUrl, setCurrentPageUrl] = useState<string>('');
  const [currentPageName, setCurrentPageName] = useState<string>('Homepage');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

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
      const welcomeMessage: Message = {
        id: '1',
        content: `🚀 **Connected to ${data.productType} website**: **${data.websiteUrl}**\n\n**Current page**: ${initialPageName}\n\nI'll automatically track your navigation as you browse through your website. Simply click on links within the site and I'll update the context to provide page-specific insights!\n\n💡 **Tip**: Navigate naturally through your website - I'll detect page changes and provide relevant analysis for each page you visit.`,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: getInitialSuggestions(data.productType),
        pageContext: initialPageName
      };
      setMessages([welcomeMessage]);
    } else {
      // No website data found, redirect to add website page
      const errorMessage: Message = {
        id: '1',
        content: `⚠️ **No website data found!** Please add your website first to start getting insights.`,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: ['Add my website', 'Go back to setup']
      };
      setMessages([errorMessage]);
    }
  }, [searchParams, setSearchParams]);

  const extractPageName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/').filter(Boolean);
      
      if (segments.length === 0) return 'Homepage';
      
      const lastSegment = segments[segments.length - 1];
      // Convert common page patterns to readable names
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
  };

  const getInitialSuggestions = (productType: string): string[] => {
    const suggestions: { [key: string]: string[] } = {
      'ecommerce': [
        "Analyze this page's conversion potential",
        "Review checkout flow optimization",
        "Improve product page layout",
        "Optimize mobile experience"
      ],
      'saas': [
        "Optimize signup conversion on this page",
        "Analyze pricing page effectiveness",
        "Improve onboarding flow",
        "Review feature presentation"
      ],
      'blog': [
        "Increase engagement on this page",
        "Optimize content for SEO",
        "Improve newsletter signups",
        "Analyze reader retention"
      ],
      'portfolio': [
        "Optimize contact conversion",
        "Improve project showcase",
        "Enhance page design",
        "Analyze visitor engagement"
      ]
    };
    
    return suggestions[productType] || [
      "Analyze this page's performance",
      "Improve conversion rates",
      "Optimize page load speeds",
      "Enhance user experience"
    ];
  };

  const getPageSpecificContext = (pageName: string, productType: string): string => {
    const contexts: { [key: string]: { [key: string]: string } } = {
      'ecommerce': {
        'Homepage': 'homepage conversion, hero section effectiveness, navigation clarity',
        'Product': 'product presentation, add-to-cart optimization, review display',
        'Pricing': 'pricing strategy, plan comparison, checkout flow',
        'Cart': 'cart abandonment, checkout process, payment options',
        'About': 'trust building, brand story, customer testimonials'
      },
      'saas': {
        'Homepage': 'value proposition clarity, trial signup, feature highlights',
        'Pricing': 'plan comparison, trial-to-paid conversion, pricing psychology',
        'Features': 'feature presentation, benefit clarity, demo requests',
        'About': 'team credibility, company story, customer success',
        'Contact': 'lead generation, sales funnel, support accessibility'
      },
      'blog': {
        'Homepage': 'content discovery, subscription conversion, navigation',
        'Post': 'content engagement, related posts, sharing optimization',
        'About': 'author credibility, newsletter signup, personal brand',
        'Contact': 'reader engagement, collaboration opportunities'
      }
    };
    
    return contexts[productType]?.[pageName] || 'general page optimization, user experience, conversion elements';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Enhanced iframe navigation detection with multiple strategies
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !websiteData) return;

    let lastUrl = currentPageUrl;
    let attempts = 0;
    const maxAttempts = 3;
    
    const checkNavigation = () => {
      attempts++;
      try {
        // Try to access iframe location
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        const iframeUrl = iframe.contentWindow?.location.href;
        
        if (iframeUrl && iframeUrl !== lastUrl && iframeUrl !== 'about:blank') {
          console.log('Navigation detected:', iframeUrl);
          lastUrl = iframeUrl;
          const newPageName = extractPageName(iframeUrl);
          
          setCurrentPageUrl(iframeUrl);
          setCurrentPageName(newPageName);
          setSearchParams({ page: iframeUrl });
          
          // Add navigation message
          const navMessage: Message = {
            id: Date.now().toString(),
            content: `🔄 **Navigation Detected!**\n\n**Page**: ${newPageName}\n**URL**: ${iframeUrl}\n\nI'm now analyzing this specific page. What would you like to know about it?`,
            sender: 'ai',
            timestamp: new Date(),
            pageContext: newPageName,
            suggestions: getInitialSuggestions(websiteData.productType)
          };
          setMessages(prev => [...prev, navMessage]);
          attempts = 0; // Reset attempts on successful detection
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          console.log('CORS restrictions detected - iframe navigation tracking limited');
          attempts = 0;
        }
      }
    };

    // Multiple detection strategies
    const interval = setInterval(checkNavigation, 1000); // Check every second
    
    // Enhanced load detection
    const handleIframeLoad = () => {
      console.log('Iframe load event triggered');
      setTimeout(() => checkNavigation(), 100);
      setTimeout(() => checkNavigation(), 500);
      setTimeout(() => checkNavigation(), 1000);
    };

    // Focus detection (when user interacts with iframe)
    const handleIframeFocus = () => {
      setTimeout(() => checkNavigation(), 100);
    };

    iframe.addEventListener('load', handleIframeLoad);
    iframe.addEventListener('focus', handleIframeFocus);

    // Initial check
    setTimeout(() => checkNavigation(), 1000);

    return () => {
      clearInterval(interval);
      iframe.removeEventListener('load', handleIframeLoad);
      iframe.removeEventListener('focus', handleIframeFocus);
    };
  }, [websiteData, setSearchParams, getInitialSuggestions]);

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
      timestamp: new Date(),
      pageContext: currentPageName
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response with page-specific insights
    setTimeout(() => {
      const pageContext = getPageSpecificContext(currentPageName, websiteData?.productType || '');
      let aiResponse = `Looking at your **${currentPageName}** page, I can help you improve ${pageContext}.\n\n`;
      
      if (websiteData) {
        if (currentPageName.toLowerCase().includes('pricing')) {
          aiResponse += "**Pricing Page Optimization:**\n• Test different pricing layouts (grid vs. table)\n• Highlight recommended plan with visual emphasis\n• Add social proof and testimonials\n• Simplify plan comparison with clear differentiators\n• Optimize CTA buttons for trial/purchase conversion";
        } else if (currentPageName.toLowerCase().includes('product')) {
          aiResponse += "**Product Page Optimization:**\n• Improve product images and gallery\n• Optimize product descriptions for conversion\n• Add customer reviews and ratings\n• Implement urgency elements (stock levels, time-limited offers)\n• Enhance add-to-cart visibility and experience";
        } else if (currentPageName.toLowerCase().includes('home')) {
          aiResponse += "**Homepage Optimization:**\n• Strengthen value proposition in hero section\n• Improve navigation and user journey clarity\n• Add trust signals and social proof\n• Optimize call-to-action placement and copy\n• Enhance mobile responsiveness and load speed";
        } else {
          aiResponse += `**${currentPageName} Page Optimization:**\n• Analyze page-specific conversion goals\n• Improve content clarity and user flow\n• Optimize call-to-action elements\n• Enhance visual hierarchy and readability\n• Test different layout variations for better performance`;
        }
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        pageContext: currentPageName
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const navigateToPage = (url: string) => {
    setCurrentPageUrl(url);
    const pageName = extractPageName(url);
    setCurrentPageName(pageName);
    
    // Update URL with page parameter
    setSearchParams({ page: url });
    
    // Add context message
    const contextMessage: Message = {
      id: Date.now().toString(),
      content: `📍 Navigated to **${pageName}** page. I'm now analyzing this specific page and can provide targeted insights for optimization.`,
      sender: 'ai',
      timestamp: new Date(),
      pageContext: pageName
    };
    setMessages(prev => [...prev, contextMessage]);
  };

  return (
    <div className="bg-gray-900 flex flex-col h-screen text-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat Interface (30% width, Lovable-style) */}
        <div className="w-full md:w-[30%] flex flex-col bg-gray-900 border-r border-gray-700">
          {/* Chat Header - Lovable Style */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-gray-400" />
              <h1 className="text-white text-lg font-medium">{websiteData ? new URL(websiteData.websiteUrl).hostname : 'No website'}</h1>
            </div>
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {showDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                  <ul className="py-2">
                    <li>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate('/add-website');
                        }}
                        className="w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700 transition-colors"
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
                        key={index}
                        onClick={() => setInputMessage(suggestion)}
                        className="bg-gray-800 border border-gray-600 text-gray-200 text-xs px-3 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
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
                
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 max-w-fit">
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
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Jackie..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          </div>
        </div>

        {/* Right Panel - Website Preview (70% width) */}
        <div className="flex flex-1 bg-[rgba(252,251,248,1)] flex-col">
          {websiteData ? (
            <div className="flex flex-col h-full">
              {/* Website Controls */}
              <div className="bg-white border-b border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{currentPageName}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                      {websiteData.productType}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => iframeRef.current?.contentWindow?.history.back()}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Go Back"
                    >
                      <ArrowLeft className="w-4 h-4 text-gray-500" />
                    </button>
                    <button 
                      onClick={() => iframeRef.current?.contentWindow?.history.forward()}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Go Forward"
                    >
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                    </button>
                    <button 
                      onClick={() => iframeRef.current?.contentWindow?.location.reload()}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Reload"
                    >
                      <RotateCcw className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
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
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter page URL..."
                  />
                  <button
                    onClick={() => navigateToPage(currentPageUrl)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Go
                  </button>
                </div>
              </div>
              
              {/* Website Preview */}
              <div className="flex-1 p-4">
                <div className="w-full h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    src={currentPageUrl}
                    className="w-full h-full"
                    title="Website Preview"
                    allow="navigation-top"
                    onLoad={() => {
                      console.log('Iframe onLoad triggered for:', currentPageUrl);
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 text-lg font-medium mb-2">
                  Website Preview
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
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