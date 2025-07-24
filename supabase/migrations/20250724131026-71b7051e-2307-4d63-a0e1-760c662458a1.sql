-- Fix the authentication architecture mismatch by allowing demo sessions
-- Update RLS policies to support both authenticated users and demo sessions

-- First, let's update the websites table policies to allow demo sessions
DROP POLICY IF EXISTS "Users can view their own websites" ON public.websites;
DROP POLICY IF EXISTS "Users can create their own websites" ON public.websites;
DROP POLICY IF EXISTS "Users can update their own websites" ON public.websites;
DROP POLICY IF EXISTS "Users can delete their own websites" ON public.websites;

-- Create new policies that work with both authenticated users and demo sessions
CREATE POLICY "Users and demo sessions can view their own websites" 
ON public.websites 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can create websites" 
ON public.websites 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can update their own websites" 
ON public.websites 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can delete their own websites" 
ON public.websites 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Update analysis_sessions table policies
DROP POLICY IF EXISTS "Users can view their own analysis sessions" ON public.analysis_sessions;
DROP POLICY IF EXISTS "Users can create their own analysis sessions" ON public.analysis_sessions;
DROP POLICY IF EXISTS "Users can update their own analysis sessions" ON public.analysis_sessions;
DROP POLICY IF EXISTS "Users can delete their own analysis sessions" ON public.analysis_sessions;

CREATE POLICY "Users and demo sessions can view their own analysis sessions" 
ON public.analysis_sessions 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can create analysis sessions" 
ON public.analysis_sessions 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can update their own analysis sessions" 
ON public.analysis_sessions 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can delete their own analysis sessions" 
ON public.analysis_sessions 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Update conversation_messages table policies
DROP POLICY IF EXISTS "Users can view their own conversation messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can create their own conversation messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can update their own conversation messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can delete their own conversation messages" ON public.conversation_messages;

CREATE POLICY "Users and demo sessions can view their own conversation messages" 
ON public.conversation_messages 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can create conversation messages" 
ON public.conversation_messages 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can update their own conversation messages" 
ON public.conversation_messages 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can delete their own conversation messages" 
ON public.conversation_messages 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Update analysis_reports table policies
DROP POLICY IF EXISTS "Users can view their own analysis reports" ON public.analysis_reports;
DROP POLICY IF EXISTS "Users can create their own analysis reports" ON public.analysis_reports;
DROP POLICY IF EXISTS "Users can update their own analysis reports" ON public.analysis_reports;
DROP POLICY IF EXISTS "Users can delete their own analysis reports" ON public.analysis_reports;

CREATE POLICY "Users and demo sessions can view their own analysis reports" 
ON public.analysis_reports 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can create analysis reports" 
ON public.analysis_reports 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can update their own analysis reports" 
ON public.analysis_reports 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Users and demo sessions can delete their own analysis reports" 
ON public.analysis_reports 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Add demo session ID column to tables for better isolation
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS demo_session_id text;
ALTER TABLE public.analysis_sessions ADD COLUMN IF NOT EXISTS demo_session_id text;
ALTER TABLE public.conversation_messages ADD COLUMN IF NOT EXISTS demo_session_id text;
ALTER TABLE public.analysis_reports ADD COLUMN IF NOT EXISTS demo_session_id text;

-- Create indexes for demo session queries
CREATE INDEX IF NOT EXISTS idx_websites_demo_session ON public.websites(demo_session_id) WHERE demo_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_demo_session ON public.analysis_sessions(demo_session_id) WHERE demo_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_messages_demo_session ON public.conversation_messages(demo_session_id) WHERE demo_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analysis_reports_demo_session ON public.analysis_reports(demo_session_id) WHERE demo_session_id IS NOT NULL;

-- Create a function to cleanup old demo data (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_demo_data()
RETURNS void AS $$
BEGIN
  -- Delete old demo websites and related data
  DELETE FROM public.analysis_reports 
  WHERE user_id IS NULL 
    AND created_at < now() - interval '24 hours';
    
  DELETE FROM public.conversation_messages 
  WHERE user_id IS NULL 
    AND created_at < now() - interval '24 hours';
    
  DELETE FROM public.analysis_sessions 
  WHERE user_id IS NULL 
    AND created_at < now() - interval '24 hours';
    
  DELETE FROM public.websites 
  WHERE user_id IS NULL 
    AND created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate demo session limits
CREATE OR REPLACE FUNCTION public.check_demo_session_limits(session_id text)
RETURNS boolean AS $$
BEGIN
  -- Check if demo session has exceeded limits (max 10 analyses per session)
  RETURN (
    SELECT count(*) 
    FROM public.analysis_sessions 
    WHERE demo_session_id = session_id 
      AND created_at > now() - interval '24 hours'
  ) < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;