import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schemas
export const updateGoalsSchema = z.object({
  goals: z.array(z.string().min(1).max(200)).min(1).max(10)
});

export const updatePreferencesSchema = z.object({
  notifications: z.boolean().optional(),
  privacy: z.enum(['public', 'friends', 'private']).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().min(2).max(5).optional(),
  timezone: z.string().optional(),
  aiPersonality: z.enum(['supportive', 'direct', 'analytical', 'encouraging']).optional(),
  reminderFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'never']).optional()
});

export const relationshipInfoSchema = z.object({
  relationshipStatus: z.enum(['single', 'dating', 'engaged', 'married', 'complicated']),
  partnerName: z.string().max(100).optional(),
  relationshipDuration: z.string().optional(),
  relationshipGoals: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional()
});

export interface ExtendedProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  dateOfBirth?: string;
  relationshipStatus?: string;
  partnerName?: string;
  relationshipDuration?: string;
  bio?: string;
  goals?: string[];
  relationshipGoals?: string[];
  challenges?: string[];
  preferences?: {
    notifications?: boolean;
    privacy?: string;
    theme?: string;
    language?: string;
    timezone?: string;
    aiPersonality?: string;
    reminderFrequency?: string;
  };
  subscriptionTier: string;
  streakCount: number;
  totalCompletedLessons: number;
  currentLevel: number;
  experiencePoints: number;
  badges: string[];
  joinedAt: string;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export class ProfileService {
  static async getFullProfile(userId: string): Promise<ExtendedProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_stats (
            streak_count,
            total_completed_lessons,
            current_level,
            experience_points,
            last_lesson_completed_at
          ),
          user_badges (
            badge_id,
            earned_at,
            badges (
              id,
              name,
              description,
              icon
            )
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error('Profile not found');
      }

      const badges = data.user_badges?.map((ub: any) => ({
        id: ub.badges.id,
        name: ub.badges.name,
        description: ub.badges.description,
        icon: ub.badges.icon,
        earnedAt: ub.earned_at
      })) || [];

      return {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        avatar: data.avatar,
        dateOfBirth: data.date_of_birth,
        relationshipStatus: data.relationship_status,
        partnerName: data.partner_name,
        relationshipDuration: data.relationship_duration,
        bio: data.bio,
        goals: data.goals,
        relationshipGoals: data.relationship_goals,
        challenges: data.challenges,
        preferences: data.preferences,
        subscriptionTier: data.subscription_tier,
        streakCount: data.user_stats?.streak_count || 0,
        totalCompletedLessons: data.user_stats?.total_completed_lessons || 0,
        currentLevel: data.user_stats?.current_level || 1,
        experiencePoints: data.user_stats?.experience_points || 0,
        badges,
        joinedAt: data.created_at,
        lastActive: data.user_stats?.last_lesson_completed_at || data.updated_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  static async updateGoals(userId: string, data: z.infer<typeof updateGoalsSchema>) {
    try {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          goals: data.goals,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update goals');
      }

      // Log goal update activity
      await this.logProfileActivity(userId, 'goals_updated', { goals: data.goals });

      return updatedProfile;
    } catch (error) {
      throw error;
    }
  }

  static async updatePreferences(userId: string, data: z.infer<typeof updatePreferencesSchema>) {
    try {
      // Get current preferences
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      const updatedPreferences = {
        ...currentProfile?.preferences,
        ...data
      };

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update preferences');
      }

      await this.logProfileActivity(userId, 'preferences_updated', data);

      return updatedProfile;
    } catch (error) {
      throw error;
    }
  }

  static async updateRelationshipInfo(userId: string, data: z.infer<typeof relationshipInfoSchema>) {
    try {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          relationship_status: data.relationshipStatus,
          partner_name: data.partnerName,
          relationship_duration: data.relationshipDuration,
          relationship_goals: data.relationshipGoals,
          challenges: data.challenges,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update relationship information');
      }

      await this.logProfileActivity(userId, 'relationship_info_updated', {
        status: data.relationshipStatus,
        hasPartnerName: !!data.partnerName,
        goalCount: data.relationshipGoals?.length || 0
      });

      return updatedProfile;
    } catch (error) {
      throw error;
    }
  }

  static async uploadAvatar(userId: string, file: Buffer, filename: string, mimeType: string) {
    try {
      // Upload to Supabase Storage
      const fileExt = filename.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) {
        throw new Error('Failed to upload avatar');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error('Failed to update profile with new avatar');
      }

      await this.logProfileActivity(userId, 'avatar_updated', { filename });

      return { avatar: publicUrl, profile: updatedProfile };
    } catch (error) {
      throw error;
    }
  }

  static async deleteAvatar(userId: string) {
    try {
      // Get current avatar URL to delete from storage
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar')
        .eq('id', userId)
        .single();

      if (profile?.avatar) {
        // Extract file path from URL
        const url = new URL(profile.avatar);
        const filePath = url.pathname.split('/').pop();
        
        if (filePath) {
          await supabase.storage
            .from('user-uploads')
            .remove([`avatars/${filePath}`]);
        }
      }

      // Update profile to remove avatar
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          avatar: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to remove avatar');
      }

      await this.logProfileActivity(userId, 'avatar_deleted', {});

      return updatedProfile;
    } catch (error) {
      throw error;
    }
  }

  static async getProfileStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Create initial stats if they don't exist
        const { data: newStats, error: createError } = await supabase
          .from('user_stats')
          .insert({
            user_id: userId,
            streak_count: 0,
            total_completed_lessons: 0,
            current_level: 1,
            experience_points: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          throw new Error('Failed to create user stats');
        }

        return newStats;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getUserBadges(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          earned_at,
          badges (
            id,
            name,
            description,
            icon,
            category
          )
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        throw new Error('Failed to get user badges');
      }

      return data.map(item => ({
        id: item.badges.id,
        name: item.badges.name,
        description: item.badges.description,
        icon: item.badges.icon,
        category: item.badges.category,
        earnedAt: item.earned_at
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getProfileActivity(userId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('profile_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error('Failed to get profile activity');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  private static async logProfileActivity(
    userId: string, 
    action: string, 
    metadata: any = {}
  ) {
    try {
      await supabase
        .from('profile_activity')
        .insert({
          user_id: userId,
          action,
          metadata,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      // Don't throw on activity logging failures
      console.error('Failed to log profile activity:', error);
    }
  }

  static async searchUsers(query: string, currentUserId: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar, bio, relationship_status')
        .or(`first_name.ilike.%${query}%, last_name.ilike.%${query}%`)
        .neq('id', currentUserId)
        .eq('preferences->privacy', 'public')
        .limit(limit);

      if (error) {
        throw new Error('Search failed');
      }

      return data.map(user => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        avatar: user.avatar,
        bio: user.bio,
        relationshipStatus: user.relationship_status
      }));
    } catch (error) {
      throw error;
    }
  }
}