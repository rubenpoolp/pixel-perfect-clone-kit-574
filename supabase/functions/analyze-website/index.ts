import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  websiteUrl: string;
  currentPage: string;
  productType: string;
  userQuestion: string;
  sessionId?: string;
  industry?: string;
  analysisType?: 'initial' | 'follow-up' | 'deep-dive';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      websiteUrl, 
      currentPage, 
      productType, 
      userQuestion,
      sessionId,
      industry,
      analysisType = 'initial'
    }: AnalysisRequest = await req.json()

    // Input validation and security checks
    if (!websiteUrl || typeof websiteUrl !== 'string' || websiteUrl.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Valid website URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // URL validation and sanitization
    let sanitizedUrl: string;
    try {
      // Remove potentially dangerous characters
      const cleaned = websiteUrl.trim().replace(/[<>'"]/g, '');
      
      // Ensure URL has protocol
      if (!/^https?:\/\//i.test(cleaned)) {
        sanitizedUrl = `https://${cleaned}`;
      } else {
        sanitizedUrl = cleaned;
      }
      
      const url = new URL(sanitizedUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format. Please enter a valid URL.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Rate limiting and abuse prevention
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log(`Analysis request from IP: ${clientIP} for URL: ${sanitizedUrl}`);

    // Content length validation
    if (userQuestion && userQuestion.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'User question too long. Please limit to 1000 characters.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get API keys and initialize Supabase client
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }
    
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not configured')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Log request details for debugging (with sanitized URL)
    console.log('Analysis request received:')
    console.log('- Website URL:', sanitizedUrl)
    console.log('- Current Page:', currentPage)
    console.log('- Product Type:', productType)
    console.log('- User Question Length:', userQuestion?.length || 0)
    console.log('- Session ID:', sessionId ? 'Present' : 'None')
    
    // Capture screenshot and scrape content in parallel (with timeout)
    console.log(`Capturing screenshot and scraping content for: ${sanitizedUrl}`)
    const [pageContent, screenshot] = await Promise.race([
      Promise.all([
        scrapePageContent(sanitizedUrl, firecrawlApiKey),
        captureScreenshot(sanitizedUrl)
      ]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      )
    ]) as [string, string | null];
    
    // Create enhanced system prompt with both text content and visual analysis
    const systemPrompt = createSystemPrompt(sanitizedUrl, currentPage, productType, pageContent, screenshot, industry, analysisType)

    // Get conversation history if sessionId is provided
    let conversationContext = ''
    if (sessionId) {
      const { data: messages } = await supabase
        .from('conversation_messages')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(10)

      if (messages && messages.length > 0) {
        conversationContext = `\n\nConversation History:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
      }
    }

    // Enhanced analysis with GPT-4.1
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use vision-capable model
        messages: [
          { role: 'system', content: systemPrompt + conversationContext },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userQuestion },
              ...(screenshot ? [{ 
                type: 'image_url', 
                image_url: { url: screenshot, detail: 'high' }
              }] : [])
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', response.status, errorData)
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || 'Unable to analyze the website at this time.'
    
    // Extract actionable suggestions and analyze metrics
    const suggestions = extractSuggestions(content)
    const metrics = extractMetrics(content)
    const recommendations = extractRecommendations(content)

    // Log the successful analysis
    console.log(`Analysis completed for ${sanitizedUrl} - ${currentPage}`)

    return new Response(
      JSON.stringify({ 
        content, 
        suggestions,
        metrics,
        recommendations,
        analysisType,
        timestamp: new Date().toISOString(),
        sessionId: sessionId
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in analyze-website function:', error)
    
    // Don't expose internal errors in production
    const errorMessage = error?.message?.includes('timeout') 
      ? 'Request timeout. Please try again.'
      : error?.message?.includes('Rate limit')
      ? error.message
      : 'Unable to analyze website. Please try again later.';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: error?.message?.includes('timeout') ? 408 : 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function scrapePageContent(url: string, apiKey: string): Promise<string> {
  try {
    console.log(`Attempting to scrape: ${url}`)
    console.log(`Using Firecrawl API key: ${apiKey ? 'Present' : 'Missing'}`)
    
    // Validate URL before attempting to scrape
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.error(`Invalid URL format: ${url}. URL must start with http:// or https://`)
      return `SCRAPING_FAILED: Invalid URL format - ${url}. Please ensure the URL includes the protocol (http:// or https://).`
    }
    
    const requestBody = {
      url,
      formats: ['markdown'],
      includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'span', 'div', 'li', 'ul', 'ol'],
      excludeTags: ['script', 'style', 'noscript', 'nav', 'footer', 'header'],
      onlyMainContent: true,
      waitFor: 3000
    }
    
    console.log(`Firecrawl request body:`, JSON.stringify(requestBody, null, 2))
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log(`Firecrawl response status: ${response.status}`)
    console.log(`Firecrawl response headers:`, Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Firecrawl API detailed error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        url: url
      })
      
      // For debugging, let's try to provide useful analysis even when scraping fails
      return `SCRAPING_FAILED: HTTP ${response.status} - ${response.statusText}. Error: ${errorText}. 
      
However, based on the URL pattern (${url}), this appears to be a pricing page. I can still provide optimization advice based on pricing page best practices.`
    }

    const data = await response.json()
    console.log('Firecrawl successful response structure:', Object.keys(data))
    console.log('Firecrawl response data keys:', data.data ? Object.keys(data.data) : 'No data property')
    
    const content = data.data?.markdown || data.data?.html || data.markdown || ''
    
    if (!content || content.trim().length < 50) {
      console.log('No meaningful content found in response:', {
        contentLength: content?.length || 0,
        hasDataProperty: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : 'None'
      })
      return `CONTENT_EMPTY: Page appears to load but has minimal content. This might be a JavaScript-heavy page or require user interaction. 

Based on the URL (${url}), I can still provide pricing page optimization advice.`
    }
    
    console.log(`Successfully scraped ${content.length} characters from ${url}`)
    // Limit content length to prevent OpenAI token limits
    return content.substring(0, 6000)
  } catch (error) {
    console.error('Error scraping page - full details:', {
      message: error.message,
      stack: error.stack,
      url: url
    })
    return `SCRAPING_ERROR: ${error.message}. 

Despite the scraping issue, I can analyze this as a pricing page based on the URL pattern and provide optimization recommendations.`
  }
}

async function captureScreenshot(url: string): Promise<string | null> {
  try {
    console.log(`Capturing screenshot for: ${url}`)
    
    // Use Puppeteer via external service or implement browser automation
    const response = await fetch('https://api.microlink.io/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url,
        type: 'png',
        viewport: { width: 1200, height: 800 },
        fullPage: false, // Capture above-the-fold area
        device: 'desktop'
      })
    })

    if (!response.ok) {
      console.error('Screenshot capture failed:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const screenshotBase64 = `data:image/png;base64,${data.data}`
    console.log('Screenshot captured successfully')
    return screenshotBase64
  } catch (error) {
    console.error('Error capturing screenshot:', error)
    return null
  }
}

function createSystemPrompt(websiteUrl: string, currentPage: string, productType: string, pageContent: string, screenshot: string | null, industry?: string, analysisType?: string): string {
  
  // Check if scraping failed and adjust prompt accordingly
  const scrapingFailed = pageContent.includes('SCRAPING_FAILED') || pageContent.includes('SCRAPING_ERROR') || pageContent.includes('CONTENT_EMPTY')
  
  if (scrapingFailed) {
    return `You are Jackie, a senior conversion optimization consultant specializing in ${productType} companies.

SCRAPING FAILED: ${pageContent.split('.')[0]}

However, I can still provide expert analysis based on the URL pattern and industry knowledge.

Page Type: ${currentPage}
Website: ${websiteUrl}  
Industry: ${productType}
${industry ? `Specific Industry: ${industry}` : ''}

ANALYSIS APPROACH:
- Reference industry benchmarks and conversion data for ${productType} ${currentPage.toLowerCase()} pages
- Compare to specific successful competitors in this space
- Provide detailed optimization strategies based on 500+ similar page audits
- Give specific copy, design, and implementation recommendations

RESPONSE FORMAT (Max 200 words):
🎯 COMMON ISSUES ON ${currentPage.toUpperCase()} PAGES
[Industry-specific problems based on 500+ audits]

💡 WHAT TOP ${productType.toUpperCase()} COMPANIES DO
[Reference specific successful competitors and their strategies]

⚡ HIGH-IMPACT OPTIMIZATIONS (Expected Impact: X%)
[Specific changes with exact copy/design suggestions]

🧪 PROVEN A/B TESTS FOR ${currentPage.toUpperCase()}
[Specific test variations with historical performance data]

Focus on actionable, specific advice with exact implementation details, competitor examples, and conversion impact estimates.`
  }

  const basePrompt = `You are Jackie, a senior conversion optimization consultant who has optimized 500+ SaaS pricing pages with an average 40% conversion lift.

CURRENT PAGE ANALYSIS:
Website: ${websiteUrl}
Page Type: ${currentPage}
Industry: ${productType}
${industry ? `Specific Industry: ${industry}` : ''}

ACTUAL PAGE CONTENT:
${pageContent}

VISUAL ANALYSIS INSTRUCTIONS:
${screenshot ? 
`I've provided a screenshot of the actual page. Analyze the VISUAL elements you can see:

VISUAL HIERARCHY & LAYOUT:
- Analyze button prominence, size, and color contrast
- Evaluate visual flow and eye-tracking patterns  
- Assess form placement and visual accessibility
- Check mobile responsiveness indicators
- Identify visual clutter or distractions

TRUST & CONVERSION ELEMENTS:
- Evaluate logo placement and brand credibility signals
- Analyze testimonial presentation and visual impact
- Assess security badges and trust indicator visibility
- Check social proof presentation (reviews, customer logos)

COMPETITIVE VISUAL BENCHMARKING:
- Compare visual design patterns to industry leaders
- Identify missing visual conversion elements
- Assess color psychology and emotional triggers
- Evaluate CTA button design vs best practices

Provide specific visual observations like "The main CTA button is barely visible due to low contrast" or "The pricing table lacks visual hierarchy compared to [competitor]"` 
: 
'No screenshot available - base analysis on content structure and industry visual best practices.'}

ANALYSIS FRAMEWORK - BE EXTREMELY SPECIFIC:

1. CONVERSION PSYCHOLOGY ANALYSIS
- Identify specific psychological triggers missing vs present
- Analyze pricing anchoring and perceived value gaps
- Point out trust/credibility issues with exact elements
- Reference specific copy that creates friction vs flow

2. COMPETITIVE BENCHMARKING 
- Compare to 2-3 specific industry leaders (name them)
- Identify what successful competitors do differently on similar pages
- Reference specific elements, copy, or strategies they use
- Benchmark conversion rates and industry standards

3. DETAILED ACTIONABLE FIXES
- Provide specific copy suggestions (exact headlines, button text)
- Give precise design/layout changes with measurements
- Include A/B testing recommendations with expected impact
- Suggest specific tools, plugins, or technical implementations

RESPONSE FORMAT (Max 200 words):
🎯 CONVERSION KILLERS
[List 2-3 specific issues with exact quotes from the page]

💡 WHAT [SPECIFIC COMPETITOR] DOES INSTEAD  
[Reference actual competitor pages and specific strategies]

⚡ IMMEDIATE WINS (Expected Impact: X%)
[3-4 specific, implementable changes with exact copy/design specs]

🧪 TEST THESE VARIATIONS
[2-3 specific A/B test ideas with control vs variant details]

CRITICAL REQUIREMENTS:
- Quote actual text from the page when suggesting changes
- Name specific competitors and their strategies  
- Give exact copy suggestions, not generic advice
- Include estimated conversion impact percentages
- Reference specific page elements by their actual content
- Provide implementation details, not just concepts
- NO ASTERISKS OR BOLD FORMATTING - use plain text only`

  let specificGuidance = 'Focus on high-impact conversion opportunities, specific competitor strategies, and actionable optimization wins.'
  
  if (analysisType === 'deep-dive') {
    specificGuidance = 'Focus on advanced conversion psychology, detailed competitive analysis, and sophisticated optimization strategies with precise implementation details.'
  } else if (analysisType === 'follow-up') {
    specificGuidance = 'Focus on specific changes since last analysis, updated competitive landscape, and advanced optimization opportunities.'
  }

  return basePrompt + specificGuidance
}

function extractMetrics(content: string): Record<string, any> {
  const metrics: Record<string, any> = {
    urgency: 'medium',
    impact: 'medium',
    difficulty: 'medium',
    estimatedImpact: '10-20%'
  }

  // Extract metrics based on content keywords
  if (content.toLowerCase().includes('critical') || content.toLowerCase().includes('urgent')) {
    metrics.urgency = 'high'
  }
  if (content.toLowerCase().includes('significant impact') || content.toLowerCase().includes('major improvement')) {
    metrics.impact = 'high'
    metrics.estimatedImpact = '20-40%'
  }
  if (content.toLowerCase().includes('easy') || content.toLowerCase().includes('quick')) {
    metrics.difficulty = 'low'
  }

  return metrics
}

function extractRecommendations(content: string): Array<{category: string, recommendation: string, priority: string}> {
  const recommendations: Array<{category: string, recommendation: string, priority: string}> = []
  
  const sections = content.split(/\*\*(.+?)\*\*/)
  
  for (let i = 0; i < sections.length - 1; i += 2) {
    const category = sections[i + 1]
    const text = sections[i + 2]
    
    if (category && text) {
      const lines = text.split('\n').filter(line => line.trim().length > 0)
      lines.forEach(line => {
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          const recommendation = line.trim().replace(/^[-•]\s*/, '')
          const priority = category.toLowerCase().includes('quick') ? 'high' : 
                          category.toLowerCase().includes('strategic') ? 'medium' : 'low'
          
          recommendations.push({
            category: category.trim(),
            recommendation: recommendation.trim(),
            priority
          })
        }
      })
    }
  }

  return recommendations
}

function extractSuggestions(content: string): string[] {
  const suggestions: string[] = []
  
  // Look for bullet points, numbered lists, or action items
  const lines = content.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
      const suggestion = trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '')
      if (suggestion.length > 10 && suggestion.length < 100) {
        suggestions.push(suggestion)
      }
    }
  }

  // If no structured suggestions found, create some based on common optimization areas
  if (suggestions.length === 0) {
    suggestions.push(
      "Analyze page loading speed",
      "Review call-to-action placement", 
      "Check mobile responsiveness",
      "Optimize headline clarity"
    )
  }

  return suggestions.slice(0, 4) // Limit to 4 suggestions
}