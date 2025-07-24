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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create a comprehensive analysis response
    const analysis = generateAnalysis({
      websiteUrl,
      currentPage: currentPage || 'Homepage',
      productType: productType || 'website',
      userQuestion: userQuestion || 'General analysis',
      industry: industry || 'general',
      analysisType: analysisType || 'initial'
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

function generateAnalysis({ websiteUrl, currentPage, productType, userQuestion, industry, analysisType }: {
  websiteUrl: string;
  currentPage: string;
  productType: string;
  userQuestion: string;
  industry: string;
  analysisType: string;
}) {
  const pageContext = getPageSpecificContext(currentPage, productType);
  
  let content = `Analyzing **${websiteUrl}** - ${currentPage} page for ${productType} optimization.\n\n`;
  
  if (currentPage.toLowerCase().includes('pricing')) {
    content += "**Pricing Page Analysis:**\n• Test different pricing layouts (grid vs. table)\n• Highlight recommended plan with visual emphasis\n• Add social proof and testimonials\n• Simplify plan comparison with clear differentiators\n• Optimize CTA buttons for trial/purchase conversion\n• Consider anchoring effect with premium tier\n• Add FAQ section for common pricing questions";
  } else if (currentPage.toLowerCase().includes('product')) {
    content += "**Product Page Analysis:**\n• Improve product images and gallery\n• Optimize product descriptions for conversion\n• Add customer reviews and ratings\n• Implement urgency elements (stock levels, time-limited offers)\n• Enhance add-to-cart visibility and experience\n• Cross-sell and upsell opportunities\n• Mobile-first product showcase";
  } else if (currentPage.toLowerCase().includes('home')) {
    content += "**Homepage Analysis:**\n• Strengthen value proposition in hero section\n• Improve navigation and user journey clarity\n• Add trust signals and social proof\n• Optimize call-to-action placement and copy\n• Enhance mobile responsiveness and load speed\n• Above-the-fold conversion optimization\n• Clear benefit communication";
  } else {
    content += `**${currentPage} Page Analysis:**\n• Analyze page-specific conversion goals\n• Improve content clarity and user flow\n• Optimize call-to-action elements\n• Enhance visual hierarchy and readability\n• Test different layout variations for better performance\n• Industry-specific ${industry} optimization\n• ${analysisType} analysis insights`;
  }

  if (userQuestion && userQuestion !== 'General analysis') {
    content += `\n\n**Specific Focus:** ${userQuestion}\n• Tailored recommendations based on your question\n• Industry best practices for ${industry}\n• Actionable next steps for implementation`;
  }

  const suggestions = [
    "Analyze conversion funnel performance",
    "Test different headline variations", 
    "Optimize mobile user experience",
    "Add social proof elements",
    "Improve page loading speed",
    "A/B test call-to-action buttons"
  ];

  const recommendations = [
    {
      category: "User Experience",
      recommendation: `Optimize ${currentPage.toLowerCase()} page navigation and user flow`,
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

  return {
    content,
    suggestions,
    recommendations,
    metrics: {
      urgency: 'medium',
      impact: 'high',
      difficulty: 'low',
      estimatedImpact: '20-30%',
      analysisType,
      industry
    },
    analysisType,
    timestamp: new Date().toISOString()
  };
}

function getPageSpecificContext(pageName: string, productType: string): string {
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
}