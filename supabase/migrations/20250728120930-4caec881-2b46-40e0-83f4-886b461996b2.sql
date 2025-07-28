-- Create tables for CUA (Computer-Using Agent) model integration

-- Table for tracking CUA sessions and interactions
CREATE TABLE public.cua_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES public.websites(id),
  user_id UUID REFERENCES auth.users(id),
  session_type TEXT NOT NULL CHECK (session_type IN ('analysis', 'testing', 'optimization', 'competitive')),
  target_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  results JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking individual CUA actions/interactions
CREATE TABLE public.cua_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.cua_sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('click', 'scroll', 'fill_form', 'navigate', 'screenshot', 'analyze', 'wait')),
  element_selector TEXT,
  action_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for A/B test configurations and results
CREATE TABLE public.cua_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES public.websites(id),
  user_id UUID REFERENCES auth.users(id),
  test_name TEXT NOT NULL,
  test_description TEXT,
  control_url TEXT NOT NULL,
  variant_configs JSONB NOT NULL, -- Array of variant configurations
  success_metrics JSONB NOT NULL, -- Conversion goals and metrics
  test_duration_days INTEGER NOT NULL DEFAULT 7,
  traffic_split JSONB NOT NULL DEFAULT '{"control": 50, "variant": 50}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  results JSONB,
  statistical_significance DECIMAL(5,4),
  winning_variant TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking conversion events and user behavior
CREATE TABLE public.cua_conversion_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.cua_sessions(id),
  ab_test_id UUID REFERENCES public.cua_ab_tests(id),
  website_id UUID REFERENCES public.websites(id),
  visitor_id UUID NOT NULL, -- Anonymous visitor tracking
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'click', 'form_submit', 'purchase', 'signup', 'custom')),
  event_data JSONB,
  url TEXT NOT NULL,
  variant TEXT, -- For A/B testing
  conversion_value DECIMAL(10,2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for competitive analysis and benchmarking
CREATE TABLE public.cua_competitive_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES public.websites(id),
  user_id UUID REFERENCES auth.users(id),
  competitor_url TEXT NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('homepage', 'pricing', 'product', 'checkout', 'full_site')),
  industry TEXT,
  analysis_results JSONB NOT NULL,
  performance_metrics JSONB,
  recommendations JSONB,
  benchmark_score INTEGER CHECK (benchmark_score >= 0 AND benchmark_score <= 100),
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.cua_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cua_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cua_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cua_conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cua_competitive_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cua_sessions
CREATE POLICY "Users can view their own CUA sessions" ON public.cua_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own CUA sessions" ON public.cua_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CUA sessions" ON public.cua_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CUA sessions" ON public.cua_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for cua_interactions
CREATE POLICY "Users can view interactions for their sessions" ON public.cua_interactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.cua_sessions 
    WHERE cua_sessions.id = cua_interactions.session_id 
    AND cua_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can create interactions for their sessions" ON public.cua_interactions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.cua_sessions 
    WHERE cua_sessions.id = cua_interactions.session_id 
    AND cua_sessions.user_id = auth.uid()
  ));

-- Create RLS policies for cua_ab_tests
CREATE POLICY "Users can view their own A/B tests" ON public.cua_ab_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own A/B tests" ON public.cua_ab_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own A/B tests" ON public.cua_ab_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own A/B tests" ON public.cua_ab_tests
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for cua_conversion_events
CREATE POLICY "Users can view conversion events for their websites" ON public.cua_conversion_events
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.websites 
    WHERE websites.id = cua_conversion_events.website_id 
    AND websites.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can insert conversion events" ON public.cua_conversion_events
  FOR INSERT WITH CHECK (true); -- Public for tracking pixels

-- Create RLS policies for cua_competitive_analysis
CREATE POLICY "Users can view their own competitive analysis" ON public.cua_competitive_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own competitive analysis" ON public.cua_competitive_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitive analysis" ON public.cua_competitive_analysis
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitive analysis" ON public.cua_competitive_analysis
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_cua_sessions_user_website ON public.cua_sessions(user_id, website_id);
CREATE INDEX idx_cua_sessions_status ON public.cua_sessions(status);
CREATE INDEX idx_cua_interactions_session ON public.cua_interactions(session_id);
CREATE INDEX idx_cua_ab_tests_user_website ON public.cua_ab_tests(user_id, website_id);
CREATE INDEX idx_cua_conversion_events_website ON public.cua_conversion_events(website_id);
CREATE INDEX idx_cua_conversion_events_visitor ON public.cua_conversion_events(visitor_id);
CREATE INDEX idx_cua_competitive_analysis_user ON public.cua_competitive_analysis(user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_cua_sessions_updated_at
  BEFORE UPDATE ON public.cua_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cua_ab_tests_updated_at
  BEFORE UPDATE ON public.cua_ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cua_competitive_analysis_updated_at
  BEFORE UPDATE ON public.cua_competitive_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();