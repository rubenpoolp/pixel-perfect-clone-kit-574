interface AnalysisRequest {
  websiteUrl: string;
  currentPage: string;
  productType: string;
  userQuestion: string;
  sessionId?: string;
  industry?: string;
  analysisType?: 'initial' | 'follow-up' | 'deep-dive';
}

interface AnalysisResponse {
  content: string;
  suggestions: string[];
  metrics?: Record<string, any>;
  recommendations?: Array<{
    category: string;
    recommendation: string;
    priority: string;
  }>;
  analysisType?: string;
  timestamp?: string;
}

export class AnalysisService {
  private static readonly FUNCTION_URL = '/api/analyze-website'; // This will be proxied to Supabase

  static async analyzeWebsite(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      // Use Supabase functions for the analysis
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('analyze-website', {
        body: JSON.stringify(request)
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        content: data.content,
        suggestions: data.suggestions || [],
        metrics: data.metrics,
        recommendations: data.recommendations,
        analysisType: data.analysisType,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Analysis service error:', error);
      
      // Fallback to enhanced demo response
      return this.getFallbackResponse(request);
    }
  }

  private static getFallbackResponse(request: AnalysisRequest): AnalysisResponse {
    const { currentPage, productType, userQuestion } = request;
    
    const pageContext = this.getPageSpecificContext(currentPage, productType);
    let content = `Looking at your **${currentPage}** page, I can help you improve ${pageContext}.\n\n`;
    
    if (currentPage.toLowerCase().includes('pricing')) {
      content += "**Pricing Page Optimization:**\n• Test different pricing layouts (grid vs. table)\n• Highlight recommended plan with visual emphasis\n• Add social proof and testimonials\n• Simplify plan comparison with clear differentiators\n• Optimize CTA buttons for trial/purchase conversion";
    } else if (currentPage.toLowerCase().includes('product')) {
      content += "**Product Page Optimization:**\n• Improve product images and gallery\n• Optimize product descriptions for conversion\n• Add customer reviews and ratings\n• Implement urgency elements (stock levels, time-limited offers)\n• Enhance add-to-cart visibility and experience";
    } else if (currentPage.toLowerCase().includes('home')) {
      content += "**Homepage Optimization:**\n• Strengthen value proposition in hero section\n• Improve navigation and user journey clarity\n• Add trust signals and social proof\n• Optimize call-to-action placement and copy\n• Enhance mobile responsiveness and load speed";
    } else {
      content += `**${currentPage} Page Optimization:**\n• Analyze page-specific conversion goals\n• Improve content clarity and user flow\n• Optimize call-to-action elements\n• Enhance visual hierarchy and readability\n• Test different layout variations for better performance`;
    }

    const suggestions = [
      "Analyze conversion funnel",
      "Test different headlines",
      "Optimize mobile experience", 
      "Add social proof elements"
    ];

    return { content, suggestions };
  }

  private static getPageSpecificContext(pageName: string, productType: string): string {
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
}