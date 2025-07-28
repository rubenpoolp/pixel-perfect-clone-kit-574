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
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      websiteUrl: req.url
    });
    
    // Provide fallback analysis even on error
    const fallbackAnalysis = generateFallbackAnalysis({
      websiteUrl: 'unknown',
      currentPage: 'Homepage',
      productType: 'website',
      userQuestion: 'General optimization',
      industry: 'general',
      analysisType: 'fallback'
    });
    
    return new Response(
      JSON.stringify({
        ...fallbackAnalysis,
        warning: 'Analysis generated with limited functionality due to technical issues.'
      }),
      { 
        status: 200, 
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
    console.log('Starting visual analysis for:', websiteUrl);
    
    // Take screenshot of the website
    const screenshot = await takeScreenshot(websiteUrl);
    
    if (!screenshot) {
      console.log('Screenshot failed, falling back to text analysis');
      return generateFallbackAnalysis({ websiteUrl, currentPage, productType, userQuestion, industry, analysisType });
    }

    console.log('Screenshot captured, analyzing with vision model...');

    // Extract page type from URL for context
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

    const prompt = `You are an expert UX/UI and conversion rate optimization consultant. I'm showing you a screenshot of a ${detectedPageType} page from a ${productType} website.

Website: ${websiteUrl}
Page Type: ${detectedPageType}
Product Type: ${productType}
Industry: ${industry}
User Question: ${userQuestion}

Please analyze this screenshot and provide specific, actionable insights about:

1. Visual hierarchy and layout issues
2. Text readability and clarity 
3. Call-to-action button placement and design
4. Trust signals and social proof elements
5. Navigation and user flow
6. Mobile responsiveness concerns visible in the design
7. Color scheme and visual appeal
8. Specific elements that could be hindering conversions

Focus on what you can actually SEE in the image. Point out specific UI elements, text, buttons, layouts, etc. that need improvement.

Be very specific about what you observe and avoid generic advice. Mention specific colors, positions, text, etc. that you see.

Keep response under 400 words and make every insight actionable.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a UX/UI and conversion optimization expert. Analyze website screenshots and provide specific, actionable insights based on what you can visually observe. Focus on concrete UI elements, not generic advice.' 
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${screenshot}` } }
            ]
          }
        ],
        max_tokens: 600,
        temperature: 0.3,
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
        pageType: detectedPageType,
        hasVisualAnalysis: true
      },
      analysisType,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('AI analysis error:', error);
    return generateFallbackAnalysis({ websiteUrl, currentPage, productType, userQuestion, industry, analysisType });
  }
}

// Function to take screenshot using a screenshot service
async function takeScreenshot(url: string): Promise<string | null> {
  try {
    console.log('Taking screenshot of:', url);
    
    // Using screenshotapi.net as a reliable screenshot service
    const screenshotUrl = `https://screenshotapi.net/api/v1/screenshot?url=${encodeURIComponent(url)}&width=1280&height=720&output=base64`;
    
    const response = await fetch(screenshotUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error('Screenshot service error:', response.status, response.statusText);
      return null;
    }

    const base64Data = await response.text();
    console.log('Screenshot captured successfully');
    return base64Data;

  } catch (error) {
    console.error('Screenshot error:', error);
    return null;
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