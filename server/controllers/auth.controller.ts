import { Request, Response } from 'express';
import { AuthService, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await AuthService.register(validatedData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email
          },
          profile: result.profile
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('already registered')) {
          return res.status(409).json({
            success: false,
            error: 'Email already registered'
          });
        }
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedData);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email
          },
          session: result.session,
          profile: result.profile
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          return res.status(401).json({
            success: false,
            error: 'Invalid email or password'
          });
        }
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      await AuthService.forgotPassword(validatedData);

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      const result = await AuthService.resetPassword(validatedData);

      res.json({
        success: true,
        message: 'Password reset successfully',
        data: {
          user: {
            id: result.user?.id,
            email: result.user?.email
          }
        }
      });
    } catch (error) {
      console.error('Reset password error:', error);
      
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed'
      });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const profile = await AuthService.getUserProfile(req.user.id);

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

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const updates = req.body;
      const updatedProfile = await AuthService.updateProfile(req.user.id, updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Update profile error:', error);
      
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      });
    }
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      await AuthService.deleteAccount(req.user.id);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete account'
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token required'
        });
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        await AuthService.logout(token);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still return success even if logout fails
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    }
  }

  static async verifyToken(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      const profile = await AuthService.getUserProfile(req.user.id);

      res.json({
        success: true,
        data: {
          user: req.user,
          profile
        }
      });
    } catch (error) {
      console.error('Verify token error:', error);
      
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  }
}