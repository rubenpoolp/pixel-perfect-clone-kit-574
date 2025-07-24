-- Fix the security warnings by setting search_path for functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix the demo session limits function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also fix the existing update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;