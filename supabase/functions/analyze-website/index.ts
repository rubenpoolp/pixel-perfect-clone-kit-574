import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteUrl, currentPage, productType, userQuestion, industry, analysisType } = await req.json();

    console.log('Analyzing website:', { websiteUrl, currentPage, productType, userQuestion, industry, analysisType });

    // Basic validation
    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ error: 'Website URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate AI-powered analysis
    const analysis = await generateAIAnalysis({
      websiteUrl,
      currentPage: currentPage || 'Homepage',
      productType: productType || 'website',
      userQuestion: userQuestion || 'How can I optimize conversions?',
      industry: industry || 'general',
      analysisType: analysisType || 'initial',
      openAIApiKey
    });

    console.log('Analysis generated successfully');

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-website function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateAIAnalysis({ websiteUrl, currentPage, productType, userQuestion, industry, analysisType, openAIApiKey }: {
  websiteUrl: string;
  currentPage: string;
  productType: string;
  userQuestion: string;
  industry: string;
  analysisType: string;
  openAIApiKey?: string;
}) {
  
  // Fallback if no OpenAI key
  if (!openAIApiKey) {
    return generateFallbackAnalysis({ websiteUrl, currentPage, productType, userQuestion, industry, analysisType });
  }

  try {
    // Extract page type from URL
    const url = new URL(websiteUrl);
    const path = url.pathname.toLowerCase();
    let detectedPageType = currentPage;
    
    if (path.includes('pricing') || path.includes('plans')) {
      detectedPageType = 'Pricing';
    } else if (path.includes('product') || path.includes('features')) {
      detectedPageType = 'Product';
    } else if (path === '/' || path === '' || path.includes('home')) {
      detectedPageType = 'Homepage';
    } else if (path.includes('about')) {
      detectedPageType = 'About';
    } else if (path.includes('contact')) {
      detectedPageType = 'Contact';
    }

    const prompt = `You are an expert conversion rate optimization consultant. Analyze the ${detectedPageType} page of a ${productType} website.

Website: ${websiteUrl}
Page Type: ${detectedPageType}
Product Type: ${productType}
Industry: ${industry}
User Question: ${userQuestion}

Provide a detailed, actionable analysis focused on conversion optimization. Be specific and avoid generic advice. Consider:

1. Page-specific conversion goals for ${detectedPageType} pages
2. ${productType} industry best practices
3. User's specific question: "${userQuestion}"
4. ${industry} industry context

Format your response as follows:
- Start with a brief overview of what you're analyzing
- Provide 4-6 specific, actionable recommendations
- Each recommendation should be concrete and implementable
- Focus on high-impact optimizations
- Avoid using asterisks (*) in your response
- Be conversational but professional

Keep the response under 300 words and make every sentence valuable.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are a conversion optimization expert. Provide specific, actionable advice without using asterisks or generic suggestions. Focus on measurable improvements.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      return generateFallbackAnalysis({ websiteUrl, currentPage: detectedPageType, productType, userQuestion, industry, analysisType });
    }

    const aiContent = data.choices[0].message.content;

    const suggestions = generatePageSpecificSuggestions(detectedPageType, productType);
    const recommendations = generateRecommendations(detectedPageType, productType);

    return {
      content: aiContent,
      suggestions,
      recommendations,
      metrics: {
        urgency: 'high',
        impact: 'high',
        difficulty: 'medium',
        estimatedImpact: '25-40%',
        analysisType,
        industry,
        pageType: detectedPageType
      },
      analysisType,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('AI analysis error:', error);
    return generateFallbackAnalysis({ websiteUrl, currentPage, productType, userQuestion, industry, analysisType });
  }
}

function generateFallbackAnalysis({ websiteUrl, currentPage, productType, userQuestion, industry, analysisType }: {
  websiteUrl: string;
  currentPage: string;
  productType: string;
  userQuestion: string;
  industry: string;
  analysisType: string;
}) {
  // Detect page type from URL
  const url = new URL(websiteUrl);
  const path = url.pathname.toLowerCase();
  let pageType = currentPage;
  
  if (path.includes('pricing') || path.includes('plans')) {
    pageType = 'Pricing';
  } else if (path.includes('product') || path.includes('features')) {
    pageType = 'Product';
  } else if (path === '/' || path === '' || path.includes('home')) {
    pageType = 'Homepage';
  }

  let content = `I'm analyzing your ${pageType.toLowerCase()} page for conversion optimization opportunities.\n\n`;
  
  if (pageType.toLowerCase().includes('pricing')) {
    content += `Here are specific ways to optimize your pricing page conversions:

1. Highlight your recommended plan with visual emphasis (different color, "Popular" badge)
2. Add customer testimonials near pricing tiers to build trust
3. Include FAQ section addressing common pricing objections
4. Test different CTA button copy ("Start Free Trial" vs "Get Started")
5. Show annual savings prominently if you offer yearly discounts
6. Add security badges near payment buttons to reduce friction`;
  } else if (pageType.toLowerCase().includes('product')) {
    content += `Here are targeted optimizations for your product page:

1. Lead with the strongest benefit in your headline
2. Add demo videos or interactive product tours
3. Include customer success stories and case studies
4. Create urgency with limited-time offers or stock indicators
5. Optimize your "Add to Cart" or "Get Started" button placement
6. Show pricing transparency to reduce checkout abandonment`;
  } else {
    content += `Here are conversion optimization opportunities for your ${pageType.toLowerCase()} page:

1. Strengthen your value proposition in the hero section
2. Add social proof elements (customer logos, testimonials)
3. Optimize your primary call-to-action placement and copy
4. Improve page loading speed and mobile experience
5. Test different headline variations for clarity
6. Add trust signals and security badges`;
  }

  const suggestions = generatePageSpecificSuggestions(pageType, productType);
  const recommendations = generateRecommendations(pageType, productType);

  return {
    content,
    suggestions,
    recommendations,
    metrics: {
      urgency: 'medium',
      impact: 'high',
      difficulty: 'low',
      estimatedImpact: '20-35%',
      analysisType,
      industry,
      pageType
    },
    analysisType,
    timestamp: new Date().toISOString()
  };
}

function generatePageSpecificSuggestions(pageType: string, productType: string): string[] {
  const baseSuggestions = [
    "Analyze conversion funnel performance",
    "A/B test headline variations",
    "Optimize mobile user experience",
    "Add social proof elements"
  ];

  if (pageType.toLowerCase().includes('pricing')) {
    return [
      "Test different pricing table layouts",
      "Add customer testimonials to pricing page",
      "Optimize pricing CTA buttons",
      "Create pricing comparison charts",
      "Test annual vs monthly pricing emphasis"
    ];
  } else if (pageType.toLowerCase().includes('product')) {
    return [
      "Add product demo videos",
      "Optimize product images",
      "Test different CTA placements",
      "Add customer reviews section",
      "Create product comparison tables"
    ];
  }

  return baseSuggestions;
}

function generateRecommendations(pageType: string, productType: string) {
  const baseRecommendations = [
    {
      category: "User Experience",
      recommendation: `Optimize ${pageType.toLowerCase()} page navigation and user flow`,
      priority: "high"
    },
    {
      category: "Conversion",
      recommendation: "Test different call-to-action placements and copy",
      priority: "high"
    },
    {
      category: "Performance",
      recommendation: "Improve page loading speed and mobile responsiveness",
      priority: "medium"
    },
    {
      category: "Trust",
      recommendation: "Add customer testimonials and trust badges",
      priority: "medium"
    }
  ];

  if (pageType.toLowerCase().includes('pricing')) {
    baseRecommendations[0].recommendation = "Implement pricing psychology techniques (anchoring, social proof)";
    baseRecommendations[1].recommendation = "Optimize trial-to-paid conversion with compelling CTAs";
  } else if (pageType.toLowerCase().includes('product')) {
    baseRecommendations[0].recommendation = "Enhance product presentation with videos and interactive elements";
    baseRecommendations[1].recommendation = "Optimize add-to-cart/signup flow and reduce friction";
  }

  return baseRecommendations;
}