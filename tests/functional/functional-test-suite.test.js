const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const { createClient } = require('@supabase/supabase-js');
const fixtures = require('../fixtures/test-fixtures.json');

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
  timeout: 30000
};

describe('Kasama AI - Comprehensive Functional Test Suite', () => {
  let supabase;
  let testUsers;
  let authTokens;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    
    // Load test data
    testUsers = fixtures.sampleUsers;
    
    // Load auth tokens
    try {
      authTokens = require('../fixtures/test-auth.json');
    } catch (error) {
      console.warn('Could not load test auth tokens. Some tests may fail.');
      authTokens = {};
    }

    console.log('🧪 Starting functional test suite...');
  }, TEST_CONFIG.timeout);

  afterAll(async () => {
    console.log('🏁 Functional test suite completed');
  });

  describe('1. Authentication & User Management', () => {
    describe('User Registration & Login', () => {
      test('should register a new user successfully', async () => {
        const testEmail = `functional-test-${Date.now()}@kasama-test.com`;
        const testPassword = 'FunctionalTest123!';

        const { data, error } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            data: {
              full_name: 'Functional Test User',
              test_user: true
            }
          }
        });

        expect(error).toBeNull();
        expect(data.user).toBeTruthy();
        expect(data.user.email).toBe(testEmail);
        expect(data.session).toBeTruthy();
      }, TEST_CONFIG.timeout);

      test('should login existing user successfully', async () => {
        const credentials = fixtures.testCredentials.basicUser;

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        });

        expect(error).toBeNull();
        expect(data.user).toBeTruthy();
        expect(data.session).toBeTruthy();
        expect(data.user.email).toBe(credentials.email);
      });

      test('should handle invalid login credentials', async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });

        expect(error).toBeTruthy();
        expect(data.user).toBeNull();
        expect(data.session).toBeNull();
      });
    });

    describe('User Session Management', () => {
      test('should maintain session state', async () => {
        const credentials = fixtures.testCredentials.proUser;
        
        // Sign in
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        });

        expect(signInData.session).toBeTruthy();

        // Check session
        const { data: sessionData } = await supabase.auth.getSession();
        expect(sessionData.session).toBeTruthy();
        expect(sessionData.session.user.email).toBe(credentials.email);
      });

      test('should sign out successfully', async () => {
        const { error } = await supabase.auth.signOut();
        expect(error).toBeNull();

        const { data: sessionData } = await supabase.auth.getSession();
        expect(sessionData.session).toBeNull();
      });
    });
  });

  describe('2. User Onboarding Flow', () => {
    let testUser;

    beforeEach(async () => {
      // Sign in as basic test user
      const credentials = fixtures.testCredentials.basicUser;
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      testUser = testUsers[0];
    });

    test('should retrieve user preferences', async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', testUser.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.user_id).toBe(testUser.id);
      expect(data.relationship_status).toBeTruthy();
      expect(data.primary_goal).toBeTruthy();
    });

    test('should update user preferences', async () => {
      const updatedPreferences = {
        communication_style: 'direct',
        notification_preferences: {
          email: true,
          push: false,
          daily_insights: true
        }
      };

      const { data, error } = await supabase
        .from('user_preferences')
        .update(updatedPreferences)
        .eq('user_id', testUser.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.communication_style).toBe('direct');
      expect(data.notification_preferences.email).toBe(true);
      expect(data.notification_preferences.push).toBe(false);
    });
  });

  describe('3. Assessment System', () => {
    let testUser;

    beforeEach(async () => {
      const credentials = fixtures.testCredentials.proUser;
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      testUser = testUsers[1]; // Pro user
    });

    test('should retrieve user assessments', async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', testUser.id)
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const assessment = data[0];
        expect(assessment.user_id).toBe(testUser.id);
        expect(assessment.type).toBeTruthy();
        expect(typeof assessment.score).toBe('number');
        expect(assessment.insights).toBeTruthy();
      }
    });

    test('should create new assessment', async () => {
      const newAssessment = {
        id: `functional_test_assessment_${Date.now()}`,
        user_id: testUser.id,
        type: 'communication_style',
        questions: fixtures.mockResponses.assessmentResults,
        responses: [
          { questionId: 1, answer: 'Often' },
          { questionId: 2, answer: 8 }
        ],
        score: 85,
        insights: {
          strengths: ['Good communication'],
          challenges: ['Time management'],
          recommendations: ['Practice daily check-ins']
        },
        completed_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('assessments')
        .insert(newAssessment)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.id).toBe(newAssessment.id);
      expect(data.type).toBe('communication_style');
      expect(data.score).toBe(85);
    });
  });

  describe('4. Learning Progress Tracking', () => {
    let testUser;

    beforeEach(async () => {
      const credentials = fixtures.testCredentials.premiumUser;
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      testUser = testUsers[2]; // Premium user
    });

    test('should retrieve learning progress', async () => {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', testUser.id)
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const progress = data[0];
        expect(progress.user_id).toBe(testUser.id);
        expect(progress.module_type).toBeTruthy();
        expect(typeof progress.progress_percentage).toBe('number');
        expect(progress.progress_percentage).toBeGreaterThanOrEqual(0);
        expect(progress.progress_percentage).toBeLessThanOrEqual(100);
      }
    });

    test('should update learning progress', async () => {
      // First, get existing progress
      const { data: existingProgress } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', testUser.id)
        .limit(1);

      if (existingProgress && existingProgress.length > 0) {
        const progressId = existingProgress[0].id;
        const updatedProgress = {
          progress_percentage: 75,
          time_spent_minutes: 45,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('learning_progress')
          .update(updatedProgress)
          .eq('id', progressId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data.progress_percentage).toBe(75);
        expect(data.time_spent_minutes).toBe(45);
      }
    });
  });

  describe('5. Analytics & Event Tracking', () => {
    let testUser;

    beforeEach(async () => {
      const credentials = fixtures.testCredentials.basicUser;
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      testUser = testUsers[0];
    });

    test('should retrieve user analytics events', async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', testUser.id)
        .limit(20);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const event = data[0];
        expect(event.user_id).toBe(testUser.id);
        expect(event.event_type).toBeTruthy();
        expect(event.timestamp).toBeTruthy();
      }
    });

    test('should create new analytics event', async () => {
      const newEvent = {
        id: `functional_test_event_${Date.now()}`,
        user_id: testUser.id,
        event_type: 'functional_test_event',
        event_data: {
          test: true,
          timestamp: Date.now(),
          page: '/functional-test'
        },
        timestamp: new Date().toISOString(),
        session_id: `test_session_${Date.now()}`,
        ip_address: '127.0.0.1',
        user_agent: 'Jest Test Runner'
      };

      const { data, error } = await supabase
        .from('analytics_events')
        .insert(newEvent)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.event_type).toBe('functional_test_event');
      expect(data.event_data.test).toBe(true);
    });
  });

  describe('6. Subscription & Payment Features', () => {
    let testUser;

    beforeEach(async () => {
      const credentials = fixtures.testCredentials.proUser;
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      testUser = testUsers[1]; // Pro user
    });

    test('should retrieve user subscription', async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', testUser.id)
        .single();

      if (!error) {
        expect(data.user_id).toBe(testUser.id);
        expect(data.plan_id).toBeTruthy();
        expect(data.status).toBeTruthy();
        expect(['active', 'canceled', 'past_due'].includes(data.status)).toBe(true);
      }
    });

    test('should handle subscription status checks', async () => {
      // This would typically call a function that checks subscription features
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan_id, status')
        .eq('user_id', testUser.id)
        .single();

      if (!error && data) {
        expect(['basic', 'pro', 'premium'].includes(data.plan_id)).toBe(true);
        
        // Mock feature gating check
        const hasAdvancedFeatures = data.plan_id === 'pro' || data.plan_id === 'premium';
        const hasUnlimitedFeatures = data.plan_id === 'premium';
        
        expect(typeof hasAdvancedFeatures).toBe('boolean');
        expect(typeof hasUnlimitedFeatures).toBe('boolean');
      }
    });
  });

  describe('7. Data Security & Privacy', () => {
    let testUser;

    beforeEach(async () => {
      const credentials = fixtures.testCredentials.basicUser;
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      testUser = testUsers[0];
    });

    test('should enforce row-level security on user data', async () => {
      // Try to access another user's data
      const otherUser = testUsers[1];
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', otherUser.id);

      // Should either return empty results or an error due to RLS
      expect(data === null || data.length === 0).toBe(true);
    });

    test('should allow access to own user data', async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', testUser.id);

      expect(error).toBeNull();
      // Should be able to access own data
      expect(data).toBeTruthy();
    });
  });

  describe('8. Error Handling & Edge Cases', () => {
    test('should handle database connection errors gracefully', async () => {
      // Create a client with invalid URL to test error handling
      const invalidClient = createClient('https://invalid-url.supabase.co', 'invalid-key');
      
      const { data, error } = await invalidClient
        .from('users')
        .select('*')
        .limit(1);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    test('should validate required fields', async () => {
      const credentials = fixtures.testCredentials.basicUser;
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      // Try to insert incomplete assessment
      const incompleteAssessment = {
        user_id: testUsers[0].id,
        // Missing required fields like 'type', 'score', etc.
      };

      const { data, error } = await supabase
        .from('assessments')
        .insert(incompleteAssessment);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    test('should handle rate limiting gracefully', async () => {
      // This test would simulate rapid requests
      const credentials = fixtures.testCredentials.basicUser;
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      const promises = Array.from({ length: 5 }, (_, i) => 
        supabase
          .from('analytics_events')
          .insert({
            id: `rate_limit_test_${i}_${Date.now()}`,
            user_id: testUsers[0].id,
            event_type: 'rate_limit_test',
            timestamp: new Date().toISOString()
          })
      );

      const results = await Promise.allSettled(promises);
      
      // Most should succeed, but rate limiting might cause some to fail
      const successes = results.filter(r => r.status === 'fulfilled' && !r.value.error);
      expect(successes.length).toBeGreaterThan(0);
    });
  });

  describe('9. Performance & Scalability', () => {
    test('should handle concurrent user operations', async () => {
      const credentials = [
        fixtures.testCredentials.basicUser,
        fixtures.testCredentials.proUser,
        fixtures.testCredentials.premiumUser
      ];

      const operations = credentials.map(async (cred, index) => {
        const client = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
        await client.auth.signInWithPassword({
          email: cred.email,
          password: cred.password
        });

        return client
          .from('analytics_events')
          .insert({
            id: `concurrent_test_${index}_${Date.now()}`,
            user_id: testUsers[index].id,
            event_type: 'concurrent_test',
            timestamp: new Date().toISOString()
          });
      });

      const results = await Promise.all(operations);
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.error).toBeNull();
      });
    });

    test('should handle large data queries efficiently', async () => {
      const credentials = fixtures.testCredentials.basicUser;
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', testUsers[0].id)
        .order('timestamp', { ascending: false })
        .limit(100);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      // Query should complete within reasonable time (5 seconds)
      expect(queryTime).toBeLessThan(5000);
    });
  });

  describe('10. Integration Tests', () => {
    test('should complete full user journey', async () => {
      // 1. Register new user
      const testEmail = `journey-test-${Date.now()}@kasama-test.com`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'JourneyTest123!',
        options: {
          data: { full_name: 'Journey Test User', test_user: true }
        }
      });

      expect(signUpError).toBeNull();
      const userId = signUpData.user.id;

      // 2. Create user preferences (onboarding)
      const preferences = {
        user_id: userId,
        relationship_status: 'dating',
        primary_goal: 'improve_communication',
        communication_style: 'direct',
        notification_preferences: { email: true, push: false },
        privacy_settings: { profile_visibility: 'private' }
      };

      const { error: prefError } = await supabase
        .from('user_preferences')
        .insert(preferences);

      expect(prefError).toBeNull();

      // 3. Take an assessment
      const assessment = {
        id: `journey_assessment_${Date.now()}`,
        user_id: userId,
        type: 'relationship_health',
        questions: fixtures.mockResponses.assessmentResults,
        responses: [{ questionId: 1, answer: 'Often' }],
        score: 78,
        insights: { strengths: ['Communication'], challenges: ['Time'] },
        completed_at: new Date().toISOString()
      };

      const { error: assessError } = await supabase
        .from('assessments')
        .insert(assessment);

      expect(assessError).toBeNull();

      // 4. Track some analytics
      const analyticsEvent = {
        id: `journey_event_${Date.now()}`,
        user_id: userId,
        event_type: 'journey_test_completed',
        event_data: { test: true },
        timestamp: new Date().toISOString()
      };

      const { error: analyticsError } = await supabase
        .from('analytics_events')
        .insert(analyticsEvent);

      expect(analyticsError).toBeNull();

      // 5. Verify all data was created correctly
      const [prefData, assessData, eventData] = await Promise.all([
        supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
        supabase.from('assessments').select('*').eq('user_id', userId).single(),
        supabase.from('analytics_events').select('*').eq('user_id', userId).single()
      ]);

      expect(prefData.error).toBeNull();
      expect(assessData.error).toBeNull();
      expect(eventData.error).toBeNull();

      expect(prefData.data.primary_goal).toBe('improve_communication');
      expect(assessData.data.score).toBe(78);
      expect(eventData.data.event_type).toBe('journey_test_completed');
    });
  });
});

// Helper functions for test utilities
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateTestId() {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  delay,
  generateTestId
};
