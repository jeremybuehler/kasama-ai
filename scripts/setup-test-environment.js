#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test environment configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  testUsers: 50,
  testAssessments: 200,
  testLearningProgress: 300,
  testAnalyticsEvents: 1000
};

class TestEnvironmentSetup {
  constructor() {
    if (!TEST_CONFIG.supabaseUrl || !TEST_CONFIG.supabaseKey) {
      throw new Error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    this.testData = {
      users: [],
      assessments: [],
      learningProgress: [],
      analyticsEvents: []
    };
  }

  async setup() {
    console.log('🚀 Setting up test environment...\n');

    try {
      // 1. Verify database connection
      await this.verifyConnection();

      // 2. Clean existing test data
      await this.cleanTestData();

      // 3. Create test users
      await this.createTestUsers();

      // 4. Seed test data
      await this.seedTestData();

      // 5. Create test scenarios
      await this.createTestScenarios();

      // 6. Generate test fixtures
      await this.generateTestFixtures();

      // 7. Setup test authentication
      await this.setupTestAuth();

      console.log('✅ Test environment setup completed successfully!');
      console.log('\nTest Data Summary:');
      console.log(`- Users: ${this.testData.users.length}`);
      console.log(`- Assessments: ${this.testData.assessments.length}`);
      console.log(`- Learning Progress: ${this.testData.learningProgress.length}`);
      console.log(`- Analytics Events: ${this.testData.analyticsEvents.length}`);

    } catch (error) {
      console.error('❌ Test environment setup failed:', error.message);
      throw error;
    }
  }

  async verifyConnection() {
    console.log('📡 Verifying database connection...');
    
    const { data, error } = await this.supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('✅ Database connection verified');
  }

  async cleanTestData() {
    console.log('🧹 Cleaning existing test data...');

    // Delete test data in reverse dependency order
    const tables = [
      'analytics_events',
      'learning_progress', 
      'assessments',
      'user_subscriptions',
      'user_preferences',
      'daily_practices'
    ];

    for (const table of tables) {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .like('user_id', 'test_%');
      
      if (error && !error.message.includes('does not exist')) {
        console.warn(`Warning: Could not clean ${table}:`, error.message);
      }
    }

    // Clean test users (keeping real users)
    const { error: userError } = await this.supabase
      .from('users')
      .delete()
      .like('id', 'test_%');

    if (userError && !userError.message.includes('does not exist')) {
      console.warn('Warning: Could not clean test users:', userError.message);
    }

    console.log('✅ Test data cleaned');
  }

  async createTestUsers() {
    console.log('👥 Creating test users...');

    const users = [];
    const userTypes = ['basic', 'pro', 'premium'];
    const relationshipStatuses = ['single', 'dating', 'married', 'divorced'];
    const goalTypes = ['improve_communication', 'resolve_conflicts', 'build_trust', 'enhance_intimacy'];

    for (let i = 0; i < TEST_CONFIG.testUsers; i++) {
      const userId = `test_user_${i + 1}`;
      const userType = userTypes[i % userTypes.length];
      
      const user = {
        id: userId,
        email: `test${i + 1}@kasama-test.com`,
        full_name: faker.person.fullName(),
        created_at: faker.date.between({ 
          from: new Date('2024-01-01'), 
          to: new Date() 
        }).toISOString(),
        updated_at: new Date().toISOString(),
        // Test-specific metadata
        test_user: true,
        test_type: userType
      };

      users.push(user);

      // Create user preferences
      const preferences = {
        user_id: userId,
        relationship_status: relationshipStatuses[Math.floor(Math.random() * relationshipStatuses.length)],
        primary_goal: goalTypes[Math.floor(Math.random() * goalTypes.length)],
        communication_style: faker.helpers.arrayElement(['direct', 'gentle', 'analytical', 'emotional']),
        notification_preferences: {
          email: faker.datatype.boolean(),
          push: faker.datatype.boolean(),
          daily_insights: faker.datatype.boolean()
        },
        privacy_settings: {
          profile_visibility: faker.helpers.arrayElement(['private', 'public', 'friends_only']),
          data_sharing: faker.datatype.boolean(),
          analytics_tracking: faker.datatype.boolean()
        },
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      // Create subscription if not basic
      if (userType !== 'basic') {
        const subscription = {
          user_id: userId,
          plan_id: userType,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          stripe_customer_id: `cus_test_${userId}`,
          stripe_subscription_id: `sub_test_${userId}`,
          created_at: user.created_at,
          updated_at: user.updated_at
        };

        // Insert subscription
        const { error: subError } = await this.supabase
          .from('user_subscriptions')
          .insert(subscription);

        if (subError) {
          console.warn(`Could not create subscription for ${userId}:`, subError.message);
        }
      }

      // Insert user preferences
      const { error: prefError } = await this.supabase
        .from('user_preferences')
        .insert(preferences);

      if (prefError) {
        console.warn(`Could not create preferences for ${userId}:`, prefError.message);
      }
    }

    // Insert users in batches
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const { error } = await this.supabase.auth.admin.createUser({
        email: batch[0].email,
        password: 'testpassword123',
        email_confirm: true,
        user_metadata: {
          full_name: batch[0].full_name,
          test_user: true
        }
      });

      // Also insert into users table for easier querying
      const { error: insertError } = await this.supabase
        .from('users')
        .insert(batch);

      if (insertError) {
        console.warn(`Could not insert user batch:`, insertError.message);
      }
    }

    this.testData.users = users;
    console.log(`✅ Created ${users.length} test users`);
  }

  async seedTestData() {
    console.log('🌱 Seeding test data...');

    // Create assessments
    await this.createTestAssessments();
    
    // Create learning progress
    await this.createTestLearningProgress();
    
    // Create analytics events
    await this.createTestAnalyticsEvents();

    // Create daily practices
    await this.createTestDailyPractices();
  }

  async createTestAssessments() {
    console.log('📊 Creating test assessments...');

    const assessmentTypes = ['relationship_health', 'communication_style', 'conflict_resolution', 'intimacy_assessment'];
    const assessments = [];

    for (let i = 0; i < TEST_CONFIG.testAssessments; i++) {
      const user = this.testData.users[Math.floor(Math.random() * this.testData.users.length)];
      
      const assessment = {
        id: `test_assessment_${i + 1}`,
        user_id: user.id,
        type: assessmentTypes[Math.floor(Math.random() * assessmentTypes.length)],
        questions: this.generateAssessmentQuestions(),
        responses: this.generateAssessmentResponses(),
        score: Math.floor(Math.random() * 100) + 1,
        insights: this.generateAssessmentInsights(),
        completed_at: faker.date.between({ 
          from: new Date(user.created_at), 
          to: new Date() 
        }).toISOString(),
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      };

      assessments.push(assessment);
    }

    // Insert assessments in batches
    const batchSize = 25;
    for (let i = 0; i < assessments.length; i += batchSize) {
      const batch = assessments.slice(i, i + batchSize);
      const { error } = await this.supabase
        .from('assessments')
        .insert(batch);

      if (error) {
        console.warn(`Could not insert assessment batch:`, error.message);
      }
    }

    this.testData.assessments = assessments;
    console.log(`✅ Created ${assessments.length} test assessments`);
  }

  async createTestLearningProgress() {
    console.log('📚 Creating test learning progress...');

    const moduleTypes = ['communication_basics', 'active_listening', 'conflict_resolution', 'emotional_intelligence'];
    const progress = [];

    for (let i = 0; i < TEST_CONFIG.testLearningProgress; i++) {
      const user = this.testData.users[Math.floor(Math.random() * this.testData.users.length)];
      
      const learningEntry = {
        id: `test_learning_${i + 1}`,
        user_id: user.id,
        module_id: `module_${moduleTypes[Math.floor(Math.random() * moduleTypes.length)]}`,
        module_type: moduleTypes[Math.floor(Math.random() * moduleTypes.length)],
        progress_percentage: Math.floor(Math.random() * 101),
        completed: Math.random() > 0.3,
        completion_date: faker.date.between({ 
          from: new Date(user.created_at), 
          to: new Date() 
        }).toISOString(),
        time_spent_minutes: Math.floor(Math.random() * 120) + 5,
        quiz_scores: Array.from({ length: 3 }, () => Math.floor(Math.random() * 100) + 1),
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      };

      progress.push(learningEntry);
    }

    // Insert learning progress in batches
    const batchSize = 25;
    for (let i = 0; i < progress.length; i += batchSize) {
      const batch = progress.slice(i, i + batchSize);
      const { error } = await this.supabase
        .from('learning_progress')
        .insert(batch);

      if (error) {
        console.warn(`Could not insert learning progress batch:`, error.message);
      }
    }

    this.testData.learningProgress = progress;
    console.log(`✅ Created ${progress.length} learning progress entries`);
  }

  async createTestAnalyticsEvents() {
    console.log('📈 Creating test analytics events...');

    const eventTypes = ['page_view', 'button_click', 'assessment_started', 'assessment_completed', 'module_started', 'module_completed'];
    const events = [];

    for (let i = 0; i < TEST_CONFIG.testAnalyticsEvents; i++) {
      const user = this.testData.users[Math.floor(Math.random() * this.testData.users.length)];
      
      const event = {
        id: `test_event_${i + 1}`,
        user_id: user.id,
        event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        event_data: {
          page: faker.helpers.arrayElement(['/dashboard', '/assessment', '/learning', '/profile', '/billing']),
          referrer: faker.internet.url(),
          session_id: faker.string.uuid(),
          duration: Math.floor(Math.random() * 300000) // 0-5 minutes in ms
        },
        timestamp: faker.date.between({ 
          from: new Date(user.created_at), 
          to: new Date() 
        }).toISOString(),
        session_id: faker.string.uuid(),
        ip_address: faker.internet.ip(),
        user_agent: faker.internet.userAgent()
      };

      events.push(event);
    }

    // Insert analytics events in batches
    const batchSize = 50;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const { error } = await this.supabase
        .from('analytics_events')
        .insert(batch);

      if (error) {
        console.warn(`Could not insert analytics events batch:`, error.message);
      }
    }

    this.testData.analyticsEvents = events;
    console.log(`✅ Created ${events.length} analytics events`);
  }

  async createTestDailyPractices() {
    console.log('🧘 Creating test daily practices...');

    const practiceTypes = ['gratitude_journal', 'communication_exercise', 'mindfulness', 'relationship_check_in'];
    const practices = [];

    // Create practices for each user over the last 30 days
    for (const user of this.testData.users.slice(0, 20)) { // Only for first 20 users
      for (let day = 0; day < 30; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);

        // Random chance of completing practice each day
        if (Math.random() > 0.3) {
          const practice = {
            id: `test_practice_${user.id}_${day}`,
            user_id: user.id,
            practice_type: practiceTypes[Math.floor(Math.random() * practiceTypes.length)],
            completed: Math.random() > 0.2,
            completion_date: date.toISOString(),
            duration_minutes: Math.floor(Math.random() * 30) + 5,
            reflection_notes: faker.lorem.sentences(2),
            mood_before: Math.floor(Math.random() * 5) + 1,
            mood_after: Math.floor(Math.random() * 5) + 1,
            created_at: date.toISOString(),
            updated_at: date.toISOString()
          };

          practices.push(practice);
        }
      }
    }

    // Insert daily practices in batches
    const batchSize = 25;
    for (let i = 0; i < practices.length; i += batchSize) {
      const batch = practices.slice(i, i + batchSize);
      const { error } = await this.supabase
        .from('daily_practices')
        .insert(batch);

      if (error) {
        console.warn(`Could not insert daily practices batch:`, error.message);
      }
    }

    console.log(`✅ Created ${practices.length} daily practice entries`);
  }

  async createTestScenarios() {
    console.log('🎬 Creating test scenarios...');

    const scenarios = [
      {
        name: 'new_user_onboarding',
        description: 'Fresh user going through complete onboarding flow',
        userId: 'test_user_1',
        steps: [
          'signup',
          'email_verification',
          'onboarding_welcome',
          'goal_selection',
          'personality_assessment',
          'ai_coach_intro',
          'preferences_setup',
          'first_task_completion'
        ]
      },
      {
        name: 'power_user_workflow',
        description: 'Advanced user with pro subscription accessing all features',
        userId: 'test_user_5',
        steps: [
          'dashboard_access',
          'advanced_assessment',
          'ai_coaching_session',
          'learning_module_completion',
          'progress_analytics_review',
          'billing_management'
        ]
      },
      {
        name: 'struggling_relationship',
        description: 'User dealing with relationship challenges',
        userId: 'test_user_10',
        steps: [
          'crisis_assessment',
          'urgent_ai_coaching',
          'conflict_resolution_module',
          'daily_check_in',
          'progress_tracking'
        ]
      }
    ];

    // Save scenarios to file
    const scenariosPath = path.join(__dirname, '..', 'tests', 'fixtures', 'test-scenarios.json');
    await fs.promises.mkdir(path.dirname(scenariosPath), { recursive: true });
    await fs.promises.writeFile(scenariosPath, JSON.stringify(scenarios, null, 2));

    console.log(`✅ Created ${scenarios.length} test scenarios`);
  }

  async generateTestFixtures() {
    console.log('📦 Generating test fixtures...');

    const fixturesDir = path.join(__dirname, '..', 'tests', 'fixtures');
    await fs.promises.mkdir(fixturesDir, { recursive: true });

    // Sample test data for different scenarios
    const fixtures = {
      sampleUsers: this.testData.users.slice(0, 5),
      sampleAssessments: this.testData.assessments.slice(0, 10),
      sampleLearningProgress: this.testData.learningProgress.slice(0, 10),
      testCredentials: {
        basicUser: { email: 'test1@kasama-test.com', password: 'testpassword123' },
        proUser: { email: 'test5@kasama-test.com', password: 'testpassword123' },
        premiumUser: { email: 'test10@kasama-test.com', password: 'testpassword123' }
      },
      mockResponses: {
        aiCoaching: this.generateMockAIResponses(),
        assessmentResults: this.generateMockAssessmentResults(),
        learningContent: this.generateMockLearningContent()
      }
    };

    await fs.promises.writeFile(
      path.join(fixturesDir, 'test-fixtures.json'),
      JSON.stringify(fixtures, null, 2)
    );

    console.log('✅ Test fixtures generated');
  }

  async setupTestAuth() {
    console.log('🔐 Setting up test authentication...');

    // Create test authentication tokens
    const testTokens = {};

    for (let i = 0; i < 3; i++) {
      const user = this.testData.users[i];
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: user.email,
          password: 'testpassword123'
        });

        if (!error && data.session) {
          testTokens[user.id] = {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            user: data.user
          };
        }
      } catch (error) {
        console.warn(`Could not create auth token for ${user.email}:`, error.message);
      }
    }

    // Save auth tokens
    const authPath = path.join(__dirname, '..', 'tests', 'fixtures', 'test-auth.json');
    await fs.promises.writeFile(authPath, JSON.stringify(testTokens, null, 2));

    console.log('✅ Test authentication configured');
  }

  // Helper methods for generating test data
  generateAssessmentQuestions() {
    return [
      {
        id: 1,
        question: "How often do you and your partner communicate openly about your feelings?",
        type: "multiple_choice",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"]
      },
      {
        id: 2,
        question: "Rate your satisfaction with your relationship's communication",
        type: "rating",
        scale: 10
      },
      {
        id: 3,
        question: "What challenges do you face in your relationship?",
        type: "text",
        placeholder: "Describe your main challenges..."
      }
    ];
  }

  generateAssessmentResponses() {
    return [
      { questionId: 1, answer: "Sometimes" },
      { questionId: 2, answer: 7 },
      { questionId: 3, answer: "We sometimes struggle with finding time to connect deeply." }
    ];
  }

  generateAssessmentInsights() {
    return {
      strengths: ["Good emotional awareness", "Willingness to improve"],
      challenges: ["Communication frequency", "Time management"],
      recommendations: [
        "Schedule regular check-ins",
        "Practice active listening exercises",
        "Use 'I' statements when expressing concerns"
      ],
      nextSteps: ["Start with the Communication Basics module", "Set up daily practice reminders"]
    };
  }

  generateMockAIResponses() {
    return {
      coaching: "I understand you're working on improving communication with your partner. Based on your assessment, I recommend starting with active listening techniques...",
      insight: "Your relationship shows strong potential for growth. The key areas to focus on are...",
      guidance: "When conflicts arise, try using the PAUSE technique: Pause, Acknowledge, Understand, Seek solutions, Execute..."
    };
  }

  generateMockAssessmentResults() {
    return {
      communicationScore: 75,
      trustLevel: 82,
      intimacyRating: 68,
      conflictResolution: 71,
      overallHealth: 74
    };
  }

  generateMockLearningContent() {
    return {
      modules: [
        {
          id: "comm_basics",
          title: "Communication Basics",
          lessons: ["Active Listening", "Non-violent Communication", "Emotional Expression"]
        },
        {
          id: "conflict_res",
          title: "Conflict Resolution",
          lessons: ["Understanding Triggers", "De-escalation Techniques", "Finding Solutions"]
        }
      ]
    };
  }
}

// CLI execution
async function main() {
  const setup = new TestEnvironmentSetup();
  
  try {
    await setup.setup();
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { TestEnvironmentSetup };
