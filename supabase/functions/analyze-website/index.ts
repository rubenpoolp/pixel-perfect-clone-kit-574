import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  websiteUrl: string;
  currentPage: string;
  productType: string;
  userQuestion: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { websiteUrl, currentPage, productType, userQuestion }: AnalysisRequest = await req.json()

    // Get OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = `You are Jackie, an expert website optimization consultant. Analyze the provided website context to give actionable insights.

Website: ${websiteUrl}
Current Page: ${currentPage}
Product Type: ${productType}

Provide specific, actionable recommendations for improving:
- User experience and conversion rates
- Content optimization
- Design and layout improvements
- Call-to-action effectiveness
- Trust signals and credibility
- Mobile responsiveness
- Page performance

Be specific, practical, and conversational in your suggestions. Write as if you're personally consulting this business owner.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuestion }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || 'Unable to analyze the website at this time.'
    
    // Extract actionable suggestions from the response
    const suggestions = extractSuggestions(content)

    return new Response(
      JSON.stringify({ content, suggestions }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze website' 
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