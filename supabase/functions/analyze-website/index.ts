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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Create enhanced system prompt based on analysis type and context
    const systemPrompt = createSystemPrompt(websiteUrl, currentPage, productType, industry, analysisType)

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

function createSystemPrompt(websiteUrl: string, currentPage: string, productType: string, industry?: string, analysisType?: string): string {
  const basePrompt = `You are Jackie, an expert website optimization consultant. Provide SHORT, ACTIONABLE insights that tell users exactly what to do next.

Website: ${websiteUrl}
Current Page: ${currentPage}
Product/Service Type: ${productType}
${industry ? `Industry: ${industry}` : ''}
Analysis Type: ${analysisType || 'initial'}

RESPONSE FORMAT REQUIREMENTS:
- Use UPPERCASE for section titles and key points
- Use bullet points (-) and numbered lists (1., 2., 3.)
- Keep responses SHORT and focused (max 200-300 words)
- Each recommendation must be SPECIFIC and ACTIONABLE
- Tell them exactly what to change, where to change it, and why

Structure your response with clear sections using UPPERCASE titles:

🚀 QUICK WINS (do these first)
📈 STRATEGIC CHANGES (implement next)
🎯 LONG-TERM GOALS (plan for later)

Focus on:`

  const specificGuidance = analysisType === 'deep-dive' 
    ? `giving a thorough analysis of conversion funnels, user behavior patterns, personalization opportunities, A/B testing ideas, technical performance, competitive differentiation, and analytics implementation.`
    : analysisType === 'follow-up'
    ? `reviewing previous recommendations, assessing implementation progress, finding additional optimization opportunities, refining existing suggestions, and prioritizing next steps.`
    : `first impressions, clarity, value proposition effectiveness, navigation and user flow, call-to-action optimization, trust signals, mobile responsiveness, page loading performance, and conversion barriers.`

  return basePrompt + specificGuidance + `

Give specific, actionable recommendations with exact steps they can take immediately. Be direct and tell them exactly what to do, where to do it, and the expected impact.`
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