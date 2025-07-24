import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, ExternalLink, BarChart3, Users, ShoppingCart, Navigation, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

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

  useEffect(() => {
    // Get website data from localStorage
    const storedData = localStorage.getItem('websiteData');
    if (storedData) {
      const data: WebsiteData = JSON.parse(storedData);
      setWebsiteData(data);
      
      // Check if there's a page parameter in URL
      const pageParam = searchParams.get('page');
      const initialUrl = pageParam || data.websiteUrl;
      const initialPageName = pageParam ? extractPageName(pageParam) : 'Homepage';
      
      setCurrentPageUrl(initialUrl);
      setCurrentPageName(initialPageName);
      
      // Create personalized first message
      const welcomeMessage: Message = {
        id: '1',
        content: `Great! I've analyzed your ${data.productType} website. I'm currently viewing your **${initialPageName}** page.\n\nI can provide page-specific insights and recommendations. Navigate through your website using the preview, and I'll automatically update to give you targeted advice for each page.\n\nWhat would you like to improve on this page?`,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: getInitialSuggestions(data.productType),
        pageContext: initialPageName
      };
      setMessages([welcomeMessage]);
    }
  }, [searchParams]);

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

  // Aggressive navigation tracking system
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let isTrackingActive = true;
    let lastKnownUrl = currentPageUrl;
    let fastPollInterval: NodeJS.Timeout;
    let slowPollInterval: NodeJS.Timeout;
    let iframeHasFocus = false;

    // Fast polling when iframe is active
    const startFastPolling = () => {
      clearInterval(fastPollInterval);
      fastPollInterval = setInterval(() => {
        if (!isTrackingActive) return;
        
        try {
          const currentUrl = iframe.contentWindow?.location.href;
          if (currentUrl && currentUrl !== lastKnownUrl) {
            lastKnownUrl = currentUrl;
            navigateToPage(currentUrl);
          }
        } catch (e) {
          // Cross-origin - try to detect changes through other means
          detectCrossOriginNavigation();
        }
      }, 200); // Very frequent polling when active
    };

    // Slower polling when iframe is not focused
    const startSlowPolling = () => {
      clearInterval(slowPollInterval);
      slowPollInterval = setInterval(() => {
        if (!isTrackingActive || iframeHasFocus) return;
        
        try {
          const currentUrl = iframe.contentWindow?.location.href;
          if (currentUrl && currentUrl !== lastKnownUrl) {
            lastKnownUrl = currentUrl;
            navigateToPage(currentUrl);
          }
        } catch (e) {
          // Cross-origin
        }
      }, 2000);
    };

    // Cross-origin navigation detection
    const detectCrossOriginNavigation = () => {
      // Show user prompt to manually track
      const hintMessage: Message = {
        id: Date.now().toString(),
        content: `🔄 **Navigation detected!** Please copy the current URL and paste it below to continue tracking.`,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: ['Track current page', 'Copy URL from address bar']
      };
      setMessages(prev => {
        // Only add if not already showing similar message
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.content.includes('Navigation detected!')) {
          return prev;
        }
        return [...prev, hintMessage];
      });
    };

    // Event listeners for iframe focus/blur
    const handleIframeFocus = () => {
      iframeHasFocus = true;
      startFastPolling();
      clearInterval(slowPollInterval);
    };

    const handleIframeBlur = () => {
      iframeHasFocus = false;
      clearInterval(fastPollInterval);
      startSlowPolling();
    };

    // Mouse events to detect interaction
    const handleMouseEnter = () => {
      startFastPolling();
    };

    const handleMouseLeave = () => {
      if (!iframeHasFocus) {
        clearInterval(fastPollInterval);
        startSlowPolling();
      }
    };

    // Click detection
    const handleClick = () => {
      // User clicked in iframe, likely navigating
      setTimeout(() => {
        try {
          const newUrl = iframe.contentWindow?.location.href;
          if (newUrl && newUrl !== lastKnownUrl) {
            lastKnownUrl = newUrl;
            navigateToPage(newUrl);
          }
        } catch (e) {
          detectCrossOriginNavigation();
        }
      }, 300);
      
      // Start aggressive polling for a short time after click
      let clickPollCount = 0;
      const clickPollInterval = setInterval(() => {
        clickPollCount++;
        try {
          const newUrl = iframe.contentWindow?.location.href;
          if (newUrl && newUrl !== lastKnownUrl) {
            lastKnownUrl = newUrl;
            navigateToPage(newUrl);
            clearInterval(clickPollInterval);
          }
        } catch (e) {
          // Cross-origin
        }
        
        if (clickPollCount > 20) { // Stop after 4 seconds
          clearInterval(clickPollInterval);
        }
      }, 200);
    };

    // Load event
    const handleLoad = () => {
      setTimeout(() => {
        try {
          const newUrl = iframe.contentWindow?.location.href;
          if (newUrl && newUrl !== lastKnownUrl) {
            lastKnownUrl = newUrl;
            navigateToPage(newUrl);
          }
        } catch (e) {
          detectCrossOriginNavigation();
        }
      }, 100);
    };

    // Add all event listeners
    iframe.addEventListener('focus', handleIframeFocus);
    iframe.addEventListener('blur', handleIframeBlur);
    iframe.addEventListener('mouseenter', handleMouseEnter);
    iframe.addEventListener('mouseleave', handleMouseLeave);
    iframe.addEventListener('click', handleClick);
    iframe.addEventListener('load', handleLoad);

    // Start with slow polling
    startSlowPolling();

    // Cleanup
    return () => {
      isTrackingActive = false;
      clearInterval(fastPollInterval);
      clearInterval(slowPollInterval);
      iframe.removeEventListener('focus', handleIframeFocus);
      iframe.removeEventListener('blur', handleIframeBlur);
      iframe.removeEventListener('mouseenter', handleMouseEnter);
      iframe.removeEventListener('mouseleave', handleMouseLeave);
      iframe.removeEventListener('click', handleClick);
      iframe.removeEventListener('load', handleLoad);
    };
  }, [currentPageUrl, setSearchParams, setMessages]);

  // Enhanced tracking function
  const trackCurrentPage = () => {
    const urlInput = document.querySelector('#url-tracker') as HTMLInputElement;
    const url = urlInput?.value.trim();
    
    if (url) {
      navigateToPage(url);
      urlInput.value = '';
      
      // Success feedback
      const successMessage: Message = {
        id: Date.now().toString(),
        content: `✅ **Page tracked successfully!** Now analyzing: ${extractPageName(url)}. What would you like to optimize on this page?`,
        sender: 'ai',
        timestamp: new Date(),
        pageContext: extractPageName(url),
        suggestions: ['Analyze page layout', 'Check conversion elements', 'Review user flow', 'Suggest improvements']
      };
      setMessages(prev => [...prev, successMessage]);
    } else {
      // Try clipboard
      navigator.clipboard.readText().then(clipboardText => {
        if (clipboardText.startsWith('http')) {
          navigateToPage(clipboardText);
          const successMessage: Message = {
            id: Date.now().toString(),
            content: `✅ **URL from clipboard tracked!** Now analyzing: ${extractPageName(clipboardText)}`,
            sender: 'ai',
            timestamp: new Date(),
            pageContext: extractPageName(clipboardText)
          };
          setMessages(prev => [...prev, successMessage]);
        } else {
          throw new Error('No valid URL in clipboard');
        }
      }).catch(() => {
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: `⚠️ **Please paste the current page URL** in the input field to track your navigation and get specific insights.`,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      });
    }
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

  return (
    <div className="bg-white flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat Interface (30% width, dark mode) */}
        <div className="w-full md:w-[30%] flex flex-col bg-gray-900 border-r border-gray-700">
          {/* Chat Header */}
          <div className="border-b border-gray-700 p-4 bg-gray-800 flex items-center justify-center">
            <img 
              src="/lovable-uploads/c22e00c0-8844-4c75-9061-80d10b4cb779.png" 
              alt="Jackie Logo" 
              className="h-8 w-auto object-contain filter brightness-0 invert"
            />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-[rgba(95,95,93,1)]" />
                    <span className="text-[rgba(28,28,28,1)] font-medium">{currentPageName}</span>
                    <span className="bg-[rgba(247,244,237,1)] text-[rgba(95,95,93,1)] px-2 py-1 rounded text-xs">
                      {websiteData.productType}
                    </span>
                  </div>
                  
                  {/* Navigation Controls */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => iframeRef.current?.contentWindow?.history.back()}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Go Back"
                    >
                      <ArrowLeft className="w-4 h-4 text-[rgba(95,95,93,1)]" />
                    </button>
                    <button 
                      onClick={() => iframeRef.current?.contentWindow?.history.forward()}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Go Forward"
                    >
                      <ArrowRight className="w-4 h-4 text-[rgba(95,95,93,1)]" />
                    </button>
                    <button 
                      onClick={() => iframeRef.current?.contentWindow?.location.reload()}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Reload"
                    >
                      <RotateCcw className="w-4 h-4 text-[rgba(95,95,93,1)]" />
                    </button>
                  </div>
                </div>
                
                {/* URL Input */}
                <div className="mt-2 flex gap-2">
                  <input
                    type="url"
                    value={currentPageUrl}
                    onChange={(e) => setCurrentPageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        navigateToPage(currentPageUrl);
                        // Update iframe src directly
                        if (iframeRef.current) {
                          iframeRef.current.src = currentPageUrl;
                        }
                      }
                    }}
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter page URL..."
                  />
                  <button
                    onClick={() => {
                      navigateToPage(currentPageUrl);
                      // Update iframe src directly
                      if (iframeRef.current) {
                        iframeRef.current.src = currentPageUrl;
                      }
                    }}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Go
                  </button>
                </div>
              </div>
              
              {/* Website Preview */}
              <div className="flex-1 p-4">
                <div className="w-full h-full bg-white rounded-lg border border-[rgba(28,28,28,0.1)] overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    src={currentPageUrl}
                    className="w-full h-full"
                    title="Website Preview"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation allow-navigation allow-popups allow-pointer-lock"
                    allow="clipboard-read; clipboard-write"
                  />
                </div>
                
                {/* Enhanced Quick Track Section */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      id="url-tracker"
                      type="url"
                      placeholder="📋 Paste current page URL here for instant analysis..."
                      className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          trackCurrentPage();
                        }
                      }}
                    />
                    <button
                      onClick={trackCurrentPage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                      <Navigation className="w-4 h-4" />
                      Track Page
                    </button>
                  </div>
                  <div className="text-xs text-blue-600 flex items-center gap-1">
                    <span>💡</span>
                    <span><strong>Quick tip:</strong> After clicking any link above, copy the URL from your browser's address bar and paste it here for page-specific insights!</span>
                  </div>
                </div>
              </div>
              
              {/* Page Context Panel */}
              <div className="bg-white border-t border-[rgba(28,28,28,0.1)] p-4 max-h-48 overflow-y-auto">
                <h3 className="text-[rgba(28,28,28,1)] text-sm font-medium mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {currentPageName} Page Focus Areas
                </h3>
                <div className="space-y-1">
                  <div className="text-xs text-[rgba(95,95,93,1)] mb-2">
                    Context: {getPageSpecificContext(currentPageName, websiteData.productType)}
                  </div>
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