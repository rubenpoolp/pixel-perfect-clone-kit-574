// Demo session management for anonymous users
import { supabase } from "@/integrations/supabase/client";

export interface DemoSession {
  id: string;
  createdAt: Date;
  analysisCount: number;
  ipAddress?: string;
}

export class DemoSessionService {
  private static readonly SESSION_KEY = 'demo_session_id';
  private static readonly MAX_ANALYSES_PER_SESSION = 10;
  private static readonly SESSION_DURATION_HOURS = 24;

  // Generate a unique demo session ID
  static generateSessionId(): string {
    return `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get or create demo session ID
  static getDemoSessionId(): string {
    let sessionId = localStorage.getItem(this.SESSION_KEY);
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      localStorage.setItem(this.SESSION_KEY, sessionId);
    }
    
    return sessionId;
  }

  // Clear demo session
  static clearDemoSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // Check if demo session has exceeded limits
  static async checkSessionLimits(sessionId: string): Promise<{ canProceed: boolean; remainingAnalyses: number }> {
    try {
      const { data, error } = await supabase.rpc('check_demo_session_limits', { 
        session_id: sessionId 
      });

      if (error) {
        console.error('Error checking session limits:', error);
        return { canProceed: true, remainingAnalyses: this.MAX_ANALYSES_PER_SESSION };
      }

      const canProceed = data === true;
      
      // Get current analysis count for this session
      const { data: sessions } = await supabase
        .from('analysis_sessions')
        .select('id')
        .eq('demo_session_id', sessionId)
        .gte('created_at', new Date(Date.now() - this.SESSION_DURATION_HOURS * 60 * 60 * 1000).toISOString());

      const currentCount = sessions?.length || 0;
      const remainingAnalyses = Math.max(0, this.MAX_ANALYSES_PER_SESSION - currentCount);

      return { canProceed, remainingAnalyses };
    } catch (error) {
      console.error('Error checking session limits:', error);
      return { canProceed: true, remainingAnalyses: this.MAX_ANALYSES_PER_SESSION };
    }
  }

  // Get demo session analytics
  static async getDemoSessionStats(sessionId: string): Promise<{
    totalAnalyses: number;
    timeRemaining: number;
    createdAt: Date | null;
  }> {
    try {
      const { data: sessions } = await supabase
        .from('analysis_sessions')
        .select('created_at')
        .eq('demo_session_id', sessionId)
        .order('created_at', { ascending: true });

      const totalAnalyses = sessions?.length || 0;
      const createdAt = sessions?.[0]?.created_at ? new Date(sessions[0].created_at) : null;
      
      const timeRemaining = createdAt 
        ? Math.max(0, this.SESSION_DURATION_HOURS * 60 * 60 * 1000 - (Date.now() - createdAt.getTime()))
        : this.SESSION_DURATION_HOURS * 60 * 60 * 1000;

      return {
        totalAnalyses,
        timeRemaining,
        createdAt
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalAnalyses: 0,
        timeRemaining: this.SESSION_DURATION_HOURS * 60 * 60 * 1000,
        createdAt: null
      };
    }
  }

  // Rate limiting check (client-side basic check)
  static checkRateLimit(): { canProceed: boolean; resetTime?: number } {
    const rateLimitKey = 'demo_rate_limit';
    const rateLimitData = localStorage.getItem(rateLimitKey);
    
    if (rateLimitData) {
      const { count, timestamp } = JSON.parse(rateLimitData);
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      
      if (timestamp > oneHourAgo) {
        if (count >= 20) { // Max 20 requests per hour
          return { 
            canProceed: false, 
            resetTime: timestamp + 60 * 60 * 1000 
          };
        }
        
        localStorage.setItem(rateLimitKey, JSON.stringify({
          count: count + 1,
          timestamp
        }));
      } else {
        localStorage.setItem(rateLimitKey, JSON.stringify({
          count: 1,
          timestamp: Date.now()
        }));
      }
    } else {
      localStorage.setItem(rateLimitKey, JSON.stringify({
        count: 1,
        timestamp: Date.now()
      }));
    }
    
    return { canProceed: true };
  }
}