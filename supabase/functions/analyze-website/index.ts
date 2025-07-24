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

    // Scrape the actual page content using Firecrawl
    console.log(`Scraping page content for: ${currentPage}`)
    const pageContent = await scrapePageContent(currentPage, firecrawlApiKey)
    
    // Create enhanced system prompt with real page content
    const systemPrompt = createSystemPrompt(websiteUrl, currentPage, productType, pageContent, industry, analysisType)

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
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt + conversationContext },
          { role: 'user', content: userQuestion }
        ],
        temperature: 0.7,
        max_tokens: 1500
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
    console.log(`Analysis completed for ${websiteUrl} - ${currentPage}`)

    return new Response(
      JSON.stringify({ 
        content, 
        suggestions,
        metrics,
        recommendations,
        analysisType,
        timestamp: new Date().toISOString()
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
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze website',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
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
    
    const requestBody = {
      url,
      formats: ['markdown'],
      includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'span', 'div', 'li', 'ul', 'ol'],
      excludeTags: ['script', 'style', 'noscript', 'nav', 'footer', 'header'],
      onlyMainContent: true,
      waitFor: 3000,
      screenshot: false,
      fullPageScreenshot: false
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

function createSystemPrompt(websiteUrl: string, currentPage: string, productType: string, pageContent: string, industry?: string, analysisType?: string): string {
  
  // Check if scraping failed and adjust prompt accordingly
  const scrapingFailed = pageContent.includes('SCRAPING_FAILED') || pageContent.includes('SCRAPING_ERROR') || pageContent.includes('CONTENT_EMPTY')
  
  if (scrapingFailed) {
    return `You are Jackie, an expert website optimization consultant. 

IMPORTANT: The page content could not be scraped (${pageContent.split('.')[0]}), but you can still provide valuable analysis.

Current Page: ${currentPage}
Website: ${websiteUrl}  
Product Type: ${productType}
${industry ? `Industry: ${industry}` : ''}

ANALYSIS APPROACH FOR UNSCRAPABLE PAGES:
- Analyze based on the URL pattern and page type
- Provide industry-standard optimization advice for this type of page
- Reference common issues found on similar pages in the ${productType} industry
- Give specific, actionable recommendations based on best practices
- Compare to what you'd expect to see on high-converting pages of this type

RESPONSE FORMAT:
🔍 WHAT THIS PAGE SHOULD CONTAIN
📊 VS INDUSTRY LEADERS  
⚡ IMMEDIATE OPTIMIZATION PRIORITIES
💡 CONVERSION BEST PRACTICES

Focus on what a high-converting ${currentPage.toLowerCase()} page typically needs and common optimization opportunities for ${productType} companies.

Keep it specific, actionable, and focused on conversion optimization.`
  }

  const basePrompt = `You are Jackie, an expert website optimization consultant. Analyze SPECIFICALLY what you see on this exact page and compare it to industry leaders.

Current Page Being Analyzed: ${currentPage}
Website: ${websiteUrl}
Product/Service Type: ${productType}
${industry ? `Industry: ${industry}` : ''}

ACTUAL PAGE CONTENT:
${pageContent}

CRITICAL ANALYSIS REQUIREMENTS:
- Base your analysis ONLY on the specific page content provided above
- Reference ACTUAL elements, text, headlines, buttons, and layout from the scraped content
- Compare this page to best practices from industry leaders and competitors
- Provide benchmarks against similar companies/pages
- NO generic advice - everything must be page-specific and actionable based on what's actually on the page
- Quote actual text from the page when making suggestions (e.g., "Your headline 'Simple Pricing' should be...")
- Reference actual button text, CTAs, pricing details, or missing elements you can see
- Users should see immediate value by understanding exactly what's wrong with THIS specific page content

RESPONSE FORMAT:
- Use UPPERCASE for section titles 
- Use bullet points (-) and numbered lists (1., 2., 3.)
- Keep responses SHORT and focused (max 250 words)
- Each point must reference something SPECIFIC on this page
- Include competitor comparisons where relevant

Structure with these sections:
🔍 WHAT I SEE ON THIS PAGE
📊 VS INDUSTRY LEADERS  
⚡ IMMEDIATE FIXES
💡 COMPETITIVE ADVANTAGE

Focus on:`

  const specificGuidance = analysisType === 'deep-dive' 
    ? `analyzing specific page elements vs competitor pages, detailed conversion optimization opportunities, and advanced competitive benchmarking.`
    : analysisType === 'follow-up'
    ? `reviewing specific page changes since last analysis and comparing current state to competitor benchmarks.`
    : `specific page elements, layout, messaging, and how this page compares to industry leaders in the same space.`

  return basePrompt + specificGuidance + `

Remember: Only analyze what you can actually see on THIS SPECIFIC PAGE. Compare specific elements to competitors. No generic advice.`
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