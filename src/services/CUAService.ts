import { supabase } from "@/integrations/supabase/client";

export interface CUASessionRequest {
  websiteId?: string;
  targetUrl: string;
  sessionType: 'analysis' | 'testing' | 'optimization' | 'competitive';
  options?: {
    testDuration?: number;
    conversionGoals?: string[];
    competitor?: string;
    industry?: string;
  };
}

export interface CUASessionResponse {
  sessionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: any;
  interactions?: CUAInteraction[];
}

export interface CUAInteraction {
  id: string;
  actionType: 'click' | 'scroll' | 'fill_form' | 'navigate' | 'screenshot' | 'analyze' | 'wait';
  elementSelector?: string;
  actionData?: any;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
  screenshotUrl?: string;
}

export interface ABTestConfig {
  testName: string;
  description?: string;
  controlUrl: string;
  variants: {
    name: string;
    changes: any[];
  }[];
  successMetrics: {
    type: 'conversion_rate' | 'click_through_rate' | 'time_on_page';
    target?: string;
    goal?: number;
  }[];
  duration: number;
  trafficSplit: { [key: string]: number };
}

export class CUAService {
  /**
   * Start a new CUA session for autonomous website interaction
   */
  static async startSession(request: CUASessionRequest): Promise<CUASessionResponse> {
    try {
      // Create session record
      const { data: session, error: sessionError } = await supabase
        .from('cua_sessions')
        .insert({
          website_id: request.websiteId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          session_type: request.sessionType,
          target_url: request.targetUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      // Start the CUA agent via edge function
      const { data: result, error: functionError } = await supabase.functions.invoke('cua-agent', {
        body: {
          sessionId: session.id,
          targetUrl: request.targetUrl,
          sessionType: request.sessionType,
          options: request.options
        }
      });

      if (functionError) {
        // Update session with error
        await supabase
          .from('cua_sessions')
          .update({ 
            status: 'failed', 
            error_message: functionError.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', session.id);
        
        throw functionError;
      }

      return {
        sessionId: session.id,
        status: 'running',
        results: result
      };
    } catch (error) {
      console.error('Error starting CUA session:', error);
      throw error;
    }
  }

  /**
   * Get session status and results
   */
  static async getSession(sessionId: string): Promise<CUASessionResponse> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('cua_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        throw sessionError;
      }

      const { data: interactions, error: interactionsError } = await supabase
        .from('cua_interactions')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (interactionsError) {
        throw interactionsError;
      }

      return {
        sessionId: session.id,
        status: session.status as 'pending' | 'running' | 'completed' | 'failed',
        results: session.results,
        interactions: (interactions || []).map(interaction => ({
          id: interaction.id,
          actionType: interaction.action_type as 'click' | 'scroll' | 'fill_form' | 'navigate' | 'screenshot' | 'analyze' | 'wait',
          elementSelector: interaction.element_selector,
          actionData: interaction.action_data,
          timestamp: interaction.timestamp,
          success: interaction.success,
          errorMessage: interaction.error_message,
          screenshotUrl: interaction.screenshot_url
        }))
      };
    } catch (error) {
      console.error('Error getting CUA session:', error);
      throw error;
    }
  }

  /**
   * Stop a running CUA session
   */
  static async stopSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('cua_sessions')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error stopping CUA session:', error);
      throw error;
    }
  }

  /**
   * Create and start an A/B test
   */
  static async createABTest(config: ABTestConfig, websiteId?: string): Promise<string> {
    try {
      const { data: test, error } = await supabase
        .from('cua_ab_tests')
        .insert({
          website_id: websiteId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          test_name: config.testName,
          test_description: config.description,
          control_url: config.controlUrl,
          variant_configs: config.variants,
          success_metrics: config.successMetrics,
          test_duration_days: config.duration,
          traffic_split: config.trafficSplit,
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return test.id;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  /**
   * Start an A/B test
   */
  static async startABTest(testId: string): Promise<void> {
    try {
      await supabase
        .from('cua_ab_tests')
        .update({ 
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', testId);

      // Trigger test execution via edge function
      await supabase.functions.invoke('cua-ab-test-runner', {
        body: { testId }
      });
    } catch (error) {
      console.error('Error starting A/B test:', error);
      throw error;
    }
  }

  /**
   * Get A/B test results
   */
  static async getABTestResults(testId: string): Promise<any> {
    try {
      const { data: test, error } = await supabase
        .from('cua_ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) {
        throw error;
      }

      return test;
    } catch (error) {
      console.error('Error getting A/B test results:', error);
      throw error;
    }
  }

  /**
   * Run competitive analysis
   */
  static async runCompetitiveAnalysis(
    competitorUrl: string,
    analysisType: 'homepage' | 'pricing' | 'product' | 'checkout' | 'full_site',
    industry?: string,
    websiteId?: string
  ): Promise<string> {
    try {
      // Create competitive analysis record
      const { data: analysis, error: analysisError } = await supabase
        .from('cua_competitive_analysis')
        .insert({
          website_id: websiteId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          competitor_url: competitorUrl,
          analysis_type: analysisType,
          industry,
          analysis_results: {},
        })
        .select()
        .single();

      if (analysisError) {
        throw analysisError;
      }

      // Trigger competitive analysis via edge function
      await supabase.functions.invoke('cua-competitive-analyzer', {
        body: {
          analysisId: analysis.id,
          competitorUrl,
          analysisType,
          industry
        }
      });

      return analysis.id;
    } catch (error) {
      console.error('Error running competitive analysis:', error);
      throw error;
    }
  }

  /**
   * Get user's CUA sessions
   */
  static async getUserSessions(limit = 10): Promise<CUASessionResponse[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('cua_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return sessions.map(session => ({
        sessionId: session.id,
        status: session.status as 'pending' | 'running' | 'completed' | 'failed',
        results: session.results
      }));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }

  /**
   * Track conversion event
   */
  static async trackConversion(
    websiteId: string,
    visitorId: string,
    eventType: 'page_view' | 'click' | 'form_submit' | 'purchase' | 'signup' | 'custom',
    eventData: any,
    url: string,
    variant?: string,
    conversionValue?: number
  ): Promise<void> {
    try {
      await supabase
        .from('cua_conversion_events')
        .insert({
          website_id: websiteId,
          visitor_id: visitorId,
          event_type: eventType,
          event_data: eventData,
          url,
          variant,
          conversion_value: conversionValue,
          user_agent: navigator.userAgent,
          referrer: document.referrer
        });
    } catch (error) {
      console.error('Error tracking conversion:', error);
      // Don't throw error to avoid breaking user experience
    }
  }
}