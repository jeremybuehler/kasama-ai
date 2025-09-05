import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: z.string().optional(),
  relationshipStatus: z.enum(['single', 'dating', 'engaged', 'married', 'complicated']).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8)
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  dateOfBirth: z.string().optional(),
  relationshipStatus: z.enum(['single', 'dating', 'engaged', 'married', 'complicated']).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  goals: z.array(z.string()).optional(),
  preferences: z.object({
    notifications: z.boolean().optional(),
    privacy: z.enum(['public', 'friends', 'private']).optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional()
  }).optional()
});

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  dateOfBirth?: string;
  relationshipStatus?: string;
  bio?: string;
  goals?: string[];
  preferences?: {
    notifications?: boolean;
    privacy?: string;
    theme?: string;
  };
  subscriptionTier: string;
  createdAt: string;
  updatedAt: string;
}

export class AuthService {
  static async register(data: z.infer<typeof registerSchema>) {
    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth,
          relationship_status: data.relationshipStatus,
          subscription_tier: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Failed to create user profile');
      }

      return {
        user: authData.user,
        profile
      };
    } catch (error) {
      throw error;
    }
  }

  static async login(data: z.infer<typeof loginSchema>) {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      return {
        user: authData.user,
        session: authData.session,
        profile
      };
    } catch (error) {
      throw error;
    }
  }

  static async forgotPassword(data: z.infer<typeof forgotPasswordSchema>) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Password reset email sent' };
    } catch (error) {
      throw error;
    }
  }

  static async resetPassword(data: z.infer<typeof resetPasswordSchema>) {
    try {
      const { data: sessionData, error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        throw new Error(error.message);
      }

      return sessionData;
    } catch (error) {
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error('Profile not found');
      }

      return {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        avatar: data.avatar,
        dateOfBirth: data.date_of_birth,
        relationshipStatus: data.relationship_status,
        bio: data.bio,
        goals: data.goals,
        preferences: data.preferences,
        subscriptionTier: data.subscription_tier,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  static async updateProfile(userId: string, updates: z.infer<typeof updateProfileSchema>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          date_of_birth: updates.dateOfBirth,
          relationship_status: updates.relationshipStatus,
          avatar: updates.avatar,
          bio: updates.bio,
          goals: updates.goals,
          preferences: updates.preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update profile');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteAccount(userId: string) {
    try {
      // Delete user data
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      // Delete auth user
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        throw new Error('Failed to delete account');
      }

      return { message: 'Account deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  static async refreshToken(refreshToken: string) {
    try {
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async logout(accessToken: string) {
    try {
      const { error } = await supabase.auth.admin.signOut(accessToken);

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw error;
    }
  }
}