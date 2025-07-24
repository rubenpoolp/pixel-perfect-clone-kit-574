-- Phase 1: Critical RLS Policy Fixes

-- 1. Add missing UPDATE and DELETE policies for conversation_messages table
CREATE POLICY "Users can update their own conversation messages" 
ON public.conversation_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation messages" 
ON public.conversation_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Fix database function security by setting proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Add constraints to prevent null user_id in future records for critical tables
-- (Allow existing null records but prevent new ones)
ALTER TABLE public.websites 
ADD CONSTRAINT websites_user_id_not_null_new 
CHECK (user_id IS NOT NULL OR created_at < now());

ALTER TABLE public.analysis_sessions 
ADD CONSTRAINT analysis_sessions_user_id_not_null_new 
CHECK (user_id IS NOT NULL OR created_at < now());

ALTER TABLE public.conversation_messages 
ADD CONSTRAINT conversation_messages_user_id_not_null_new 
CHECK (user_id IS NOT NULL OR created_at < now());

ALTER TABLE public.analysis_reports 
ADD CONSTRAINT analysis_reports_user_id_not_null_new 
CHECK (user_id IS NOT NULL OR created_at < now());