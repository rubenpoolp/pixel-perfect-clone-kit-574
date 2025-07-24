-- Create tables for website analysis and conversation history
CREATE TABLE IF NOT EXISTS public.websites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  product_type TEXT,
  title TEXT,
  description TEXT,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis sessions table
CREATE TABLE IF NOT EXISTS public.analysis_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_page TEXT,
  session_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation messages table
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.analysis_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  suggestions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis reports table
CREATE TABLE IF NOT EXISTS public.analysis_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.analysis_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  recommendations JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  export_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for websites
CREATE POLICY "Users can view their own websites" 
ON public.websites FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own websites" 
ON public.websites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own websites" 
ON public.websites FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own websites" 
ON public.websites FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for analysis sessions
CREATE POLICY "Users can view their own analysis sessions" 
ON public.analysis_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis sessions" 
ON public.analysis_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis sessions" 
ON public.analysis_sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis sessions" 
ON public.analysis_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for conversation messages
CREATE POLICY "Users can view their own conversation messages" 
ON public.conversation_messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversation messages" 
ON public.conversation_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for analysis reports
CREATE POLICY "Users can view their own analysis reports" 
ON public.analysis_reports FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis reports" 
ON public.analysis_reports FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis reports" 
ON public.analysis_reports FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis reports" 
ON public.analysis_reports FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage buckets for screenshots and exports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('screenshots', 'screenshots', false, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp']);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('exports', 'exports', false, 52428800, ARRAY['application/pdf', 'text/csv', 'application/json']);

-- Create storage policies for screenshots
CREATE POLICY "Users can view their own screenshots" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own screenshots" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own screenshots" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for exports
CREATE POLICY "Users can view their own exports" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own exports" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own exports" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_websites_updated_at
  BEFORE UPDATE ON public.websites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_sessions_updated_at
  BEFORE UPDATE ON public.analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_reports_updated_at
  BEFORE UPDATE ON public.analysis_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();