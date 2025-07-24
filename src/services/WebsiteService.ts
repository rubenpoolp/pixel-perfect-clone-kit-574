import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DemoSessionService } from "./DemoSessionService";

export type Website = Database['public']['Tables']['websites']['Row'];
export type AnalysisSession = Database['public']['Tables']['analysis_sessions']['Row'];
export type ConversationMessage = Database['public']['Tables']['conversation_messages']['Row'];
export type AnalysisReport = Database['public']['Tables']['analysis_reports']['Row'];

export interface CreateWebsiteData {
  url: string;
  product_type?: string;
  title?: string;
  description?: string;
  industry?: string;
}

export interface CreateAnalysisSessionData {
  website_id: string;
  current_page?: string;
  session_data?: Record<string, any>;
}

export interface CreateMessageData {
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export interface CreateAnalysisReportData {
  session_id: string;
  title: string;
  summary?: string;
  recommendations: Array<{
    category: string;
    recommendation: string;
    priority: string;
  }>;
  metrics: Record<string, any>;
  export_data?: Record<string, any>;
}

export class WebsiteService {
  // Website management
  static async createWebsite(data: CreateWebsiteData): Promise<Website> {
    const { data: { user } } = await supabase.auth.getUser();
    const demoSessionId = !user ? DemoSessionService.getDemoSessionId() : undefined;
    
    const { data: website, error } = await supabase
      .from('websites')
      .insert([{
        url: data.url,
        product_type: data.product_type,
        title: data.title,
        description: data.description,
        industry: data.industry,
        user_id: user?.id || null,
        demo_session_id: demoSessionId
      }])
      .select()
      .single();

    if (error) throw error;
    return website;
  }

  static async getWebsites(): Promise<Website[]> {
    const { data: websites, error } = await supabase
      .from('websites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return websites || [];
  }

  static async getWebsite(id: string): Promise<Website | null> {
    const { data: website, error } = await supabase
      .from('websites')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return website;
  }

  static async updateWebsite(id: string, updates: Partial<Website>): Promise<Website> {
    const { data: website, error } = await supabase
      .from('websites')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return website;
  }

  static async deleteWebsite(id: string): Promise<void> {
    const { error } = await supabase
      .from('websites')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Analysis session management
  static async createAnalysisSession(data: CreateAnalysisSessionData): Promise<AnalysisSession> {
    const { data: { user } } = await supabase.auth.getUser();
    const demoSessionId = !user ? DemoSessionService.getDemoSessionId() : undefined;

    // Check demo session limits if this is a demo session
    if (!user && demoSessionId) {
      const { canProceed } = await DemoSessionService.checkSessionLimits(demoSessionId);
      
      if (!canProceed) {
        throw new Error('Demo session limit reached. Please request a demo to continue with unlimited analysis.');
      }
    }

    const { data: session, error } = await supabase
      .from('analysis_sessions')
      .insert([{
        website_id: data.website_id,
        current_page: data.current_page,
        session_data: data.session_data || {},
        user_id: user?.id || null,
        demo_session_id: demoSessionId
      }])
      .select()
      .single();

    if (error) throw error;
    return session;
  }

  static async getAnalysisSession(id: string): Promise<AnalysisSession | null> {
    const { data: session, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return session;
  }

  static async updateAnalysisSession(id: string, updates: Partial<AnalysisSession>): Promise<AnalysisSession> {
    const { data: session, error } = await supabase
      .from('analysis_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return session;
  }

  // Conversation message management
  static async saveMessage(data: CreateMessageData): Promise<ConversationMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    const demoSessionId = !user ? DemoSessionService.getDemoSessionId() : undefined;

    const { data: message, error } = await supabase
      .from('conversation_messages')
      .insert([{
        session_id: data.session_id,
        role: data.role,
        content: data.content,
        suggestions: data.suggestions || [],
        metadata: data.metadata || {},
        user_id: user?.id || null,
        demo_session_id: demoSessionId
      }])
      .select()
      .single();

    if (error) throw error;
    return message;
  }

  static async getConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
    const { data: messages, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return messages || [];
  }

  // Analysis report management
  static async createAnalysisReport(data: CreateAnalysisReportData): Promise<AnalysisReport> {
    const { data: { user } } = await supabase.auth.getUser();
    const demoSessionId = !user ? DemoSessionService.getDemoSessionId() : undefined;

    const { data: report, error } = await supabase
      .from('analysis_reports')
      .insert([{
        session_id: data.session_id,
        title: data.title,
        summary: data.summary,
        recommendations: data.recommendations,
        metrics: data.metrics,
        export_data: data.export_data || {},
        user_id: user?.id || null,
        demo_session_id: demoSessionId
      }])
      .select()
      .single();

    if (error) throw error;
    return report;
  }

  static async getAnalysisReports(): Promise<AnalysisReport[]> {
    const { data: reports, error } = await supabase
      .from('analysis_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return reports || [];
  }

  static async getAnalysisReport(id: string): Promise<AnalysisReport | null> {
    const { data: report, error } = await supabase
      .from('analysis_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return report;
  }
}