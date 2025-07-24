import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
}

export class AuthService {
  // Get current user
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    } : null;
  }

  // Sign up with email and password
  static async signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      } : null,
      error: null
    };
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      } : null,
      error: null
    };
  }

  // Sign in anonymously for demo purposes
  static async signInAnonymously(): Promise<{ user: AuthUser | null; error: string | null }> {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      return { user: null, error: error.message };
    }

    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      } : null,
      error: null
    };
  }

  // Sign out
  static async signOut(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error?.message || null };
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ? {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at
      } : null;
      callback(user);
    });
  }

  // Reset password
  static async resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message || null };
  }
}