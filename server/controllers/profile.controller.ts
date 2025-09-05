import { Response } from 'express';
import { ProfileService, updateGoalsSchema, updatePreferencesSchema, relationshipInfoSchema } from '../services/profile.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import multer from 'multer';
import { z } from 'zod';

// Configure multer for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

const searchSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(50).default(20)
});

export const avatarUpload = upload.single('avatar');

export class ProfileController {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const profile = await ProfileService.getFullProfile(req.user.id);

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Get profile error:', error);
      
      res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
  }

  static async updateGoals(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const validatedData = updateGoalsSchema.parse(req.body);
      const updatedProfile = await ProfileService.updateGoals(req.user.id, validatedData);

      res.json({
        success: true,
        message: 'Goals updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Update goals error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid goals data',
          details: error.errors
        });
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update goals'
      });
    }
  }

  static async updatePreferences(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const validatedData = updatePreferencesSchema.parse(req.body);
      const updatedProfile = await ProfileService.updatePreferences(req.user.id, validatedData);

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid preferences data',
          details: error.errors
        });
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update preferences'
      });
    }
  }

  static async updateRelationshipInfo(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const validatedData = relationshipInfoSchema.parse(req.body);
      const updatedProfile = await ProfileService.updateRelationshipInfo(req.user.id, validatedData);

      res.json({
        success: true,
        message: 'Relationship information updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Update relationship info error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid relationship data',
          details: error.errors
        });
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update relationship information'
      });
    }
  }

  static async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Avatar file is required'
        });
      }

      const result = await ProfileService.uploadAvatar(
        req.user.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: result
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload avatar'
      });
    }
  }

  static async deleteAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const updatedProfile = await ProfileService.deleteAvatar(req.user.id);

      res.json({
        success: true,
        message: 'Avatar deleted successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Delete avatar error:', error);
      
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete avatar'
      });
    }
  }

  static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const stats = await ProfileService.getProfileStats(req.user.id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get profile stats'
      });
    }
  }

  static async getBadges(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const badges = await ProfileService.getUserBadges(req.user.id);

      res.json({
        success: true,
        data: badges
      });
    } catch (error) {
      console.error('Get badges error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get user badges'
      });
    }
  }

  static async getActivity(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const activity = await ProfileService.getProfileActivity(req.user.id, limit);

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('Get activity error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get profile activity'
      });
    }
  }

  static async searchUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { query, limit } = searchSchema.parse(req.query);
      const users = await ProfileService.searchUsers(query, req.user.id, limit);

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Search users error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid search parameters',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Search failed'
      });
    }
  }

  static async getPublicProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const profile = await ProfileService.getFullProfile(userId);

      // Check privacy settings
      if (profile.preferences?.privacy === 'private') {
        return res.status(403).json({
          success: false,
          error: 'Profile is private'
        });
      }

      // Return only public information
      const publicProfile = {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        bio: profile.bio,
        relationshipStatus: profile.relationshipStatus,
        currentLevel: profile.currentLevel,
        badges: profile.badges,
        joinedAt: profile.joinedAt
      };

      res.json({
        success: true,
        data: publicProfile
      });
    } catch (error) {
      console.error('Get public profile error:', error);
      
      res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
  }
}