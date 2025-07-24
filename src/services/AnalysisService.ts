
import { supabase } from "@/integrations/supabase/client";
import { validateAndSanitizeUrl } from "@/utils/validation";
import { analysisRateLimiter, getClientIdentifier, logSecurityEvent } from "@/utils/rateLimiter";

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
  static async analyzeWebsite(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      // Rate limiting check
      const clientId = getClientIdentifier();
      const rateLimitCheck = analysisRateLimiter.checkLimit(clientId);
      
      if (!rateLimitCheck.allowed) {
        const resetMinutes = Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 60000);
        logSecurityEvent('rate_limit_exceeded', { clientId, url: request.websiteUrl });
        throw new Error(`Too many requests. Please wait ${resetMinutes} minutes before trying again.`);
      }

      // Enhanced URL validation
      const validation = validateAndSanitizeUrl(request.websiteUrl);
      if (!validation.isValid) {
        logSecurityEvent('invalid_url_attempt', { url: request.websiteUrl, error: validation.error });
        throw new Error(validation.error || 'Invalid URL provided');
      }

      // Log successful analysis request
      logSecurityEvent('analysis_request', { 
        url: validation.sanitizedUrl, 
        page: request.currentPage,
        type: request.analysisType 
      });

      // Use Supabase functions for the analysis
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('analyze-website', {
        body: JSON.stringify({
          ...request,
          websiteUrl: validation.sanitizedUrl
        })
      });

      if (error) {
        console.error('Analysis function error:', error);
        return this.getFallbackResponse(request);
      }

      if (data?.error) {
        console.error('Analysis data error:', data.error);
        return this.getFallbackResponse(request);
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
      
      // Re-throw validation and rate limit errors to show proper message
      if (error instanceof Error && (
        error.message.includes('Invalid URL') ||
        error.message.includes('required') ||
        error.message.includes('Too many requests')
      )) {
        throw error;
      }
      
      // Fallback to enhanced demo response for other errors
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

    return { 
      content, 
      suggestions,
      metrics: {
        urgency: 'medium',
        impact: 'medium',
        difficulty: 'low',
        estimatedImpact: '15-25%'
      },
      analysisType: request.analysisType || 'initial',
      timestamp: new Date().toISOString()
    };
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