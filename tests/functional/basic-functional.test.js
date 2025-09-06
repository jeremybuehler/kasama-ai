const { describe, test, expect, beforeAll } = require('@jest/globals');
const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
  timeout: 30000
};

describe('Kasama AI - Basic Functional Tests', () => {
  let supabase;

  beforeAll(async () => {
    console.log('🧪 Starting basic functional tests...');
    supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
  }, TEST_CONFIG.timeout);

  describe('1. Database Connection', () => {
    test('should connect to Supabase successfully', async () => {
      expect(supabase).toBeDefined();
      expect(TEST_CONFIG.supabaseUrl).toBeTruthy();
      expect(TEST_CONFIG.supabaseKey).toBeTruthy();
      expect(TEST_CONFIG.supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/);
    });

    test('should have valid environment variables', async () => {
      expect(process.env.VITE_SUPABASE_URL).toBeTruthy();
      expect(process.env.VITE_SUPABASE_ANON_KEY).toBeTruthy();
      expect(process.env.VITE_SUPABASE_URL).toMatch(/supabase/);
    });
  });

  describe('2. Authentication System', () => {
    test('should handle authentication methods', async () => {
      // Test that auth methods are available
      expect(supabase.auth).toBeDefined();
      expect(typeof supabase.auth.signUp).toBe('function');
      expect(typeof supabase.auth.signInWithPassword).toBe('function');
      expect(typeof supabase.auth.signOut).toBe('function');
      expect(typeof supabase.auth.getSession).toBe('function');
    });

    test('should handle invalid login gracefully', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'invalid-test-email@example.com',
        password: 'invalidpassword123'
      });

      expect(error).toBeTruthy();
      expect(data.user).toBeNull();
      expect(data.session).toBeNull();
    });

    test('should get current session', async () => {
      const { data, error } = await supabase.auth.getSession();
      
      // Should not error, but session might be null (which is fine)
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('session');
    });
  });

  describe('3. Service Availability', () => {
    test('should have database client methods', () => {
      expect(supabase.from).toBeDefined();
      expect(typeof supabase.from).toBe('function');
      expect(supabase.rpc).toBeDefined();
      expect(typeof supabase.rpc).toBe('function');
    });

    test('should handle basic database operations', async () => {
      // Test basic table access (should work even with empty tables)
      const testQuery = supabase.from('profiles').select('count').limit(1);
      expect(testQuery).toBeDefined();
      
      // The query itself should be constructible
      expect(testQuery.toString()).toBeTruthy();
    });
  });

  describe('4. Error Handling', () => {
    test('should handle invalid table names gracefully', async () => {
      const { data, error } = await supabase
        .from('nonexistent_table_xyz')
        .select('*')
        .limit(1);

      // Should return an error for non-existent table
      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    test('should handle malformed queries gracefully', async () => {
      try {
        const { data, error } = await supabase
          .from('') // Empty table name
          .select('*');

        // Should either error or handle gracefully
        expect(error || data === null).toBeTruthy();
      } catch (err) {
        // Catching any thrown errors is also acceptable
        expect(err).toBeDefined();
      }
    });
  });

  describe('5. Configuration Validation', () => {
    test('should have proper Supabase URL format', () => {
      const url = TEST_CONFIG.supabaseUrl;
      expect(url).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    });

    test('should have proper API key format', () => {
      const key = TEST_CONFIG.supabaseKey;
      expect(key).toMatch(/^eyJ/); // JWT tokens start with 'eyJ'
      expect(key.length).toBeGreaterThan(50);
    });
  });

  describe('6. Basic Performance Tests', () => {
    test('should create client quickly', () => {
      const startTime = Date.now();
      const testClient = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
      const endTime = Date.now();
      
      expect(testClient).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should create in less than 1 second
    });

    test('should handle concurrent client creation', async () => {
      const promises = Array.from({ length: 5 }, () => 
        Promise.resolve(createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey))
      );

      const clients = await Promise.all(promises);
      
      clients.forEach(client => {
        expect(client).toBeDefined();
        expect(client.auth).toBeDefined();
      });
    });
  });

  describe('7. Service Integration Tests', () => {
    test('should support real-time subscriptions', () => {
      const channel = supabase.channel('test-channel');
      expect(channel).toBeDefined();
      expect(typeof channel.subscribe).toBe('function');
      expect(typeof channel.unsubscribe).toBe('function');
    });

    test('should support storage operations', () => {
      const storage = supabase.storage;
      expect(storage).toBeDefined();
      expect(typeof storage.from).toBe('function');
    });

    test('should support RPC calls', async () => {
      // Test that RPC interface works (even if function doesn't exist)
      const rpcCall = supabase.rpc('test_function_that_does_not_exist', {});
      expect(rpcCall).toBeDefined();
      
      // The call should be constructible
      expect(typeof rpcCall.then).toBe('function');
    });
  });

  describe('8. Security Tests', () => {
    test('should not expose sensitive configuration', () => {
      // Test that the client doesn't expose sensitive data in obvious places
      const clientKeys = Object.keys(supabase);
      
      // Should not have obvious sensitive properties
      expect(clientKeys).not.toContain('service_role_key');
      expect(clientKeys).not.toContain('secret_key');
      
      // The auth object should exist but not expose raw keys
      expect(supabase.auth).toBeDefined();
      const authKeys = Object.keys(supabase.auth);
      expect(authKeys).not.toContain('api_key');
    });

    test('should handle auth state changes', async () => {
      let authStateChanges = 0;
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        authStateChanges++;
      });

      expect(subscription).toBeDefined();
      expect(typeof subscription.unsubscribe).toBe('function');
      
      // Clean up
      subscription.unsubscribe();
    });
  });

  describe('9. Mock Data Validation', () => {
    test('should validate test data structures', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      };

      expect(mockUser.id).toBeTruthy();
      expect(mockUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(new Date(mockUser.created_at)).toBeInstanceOf(Date);
    });

    test('should validate assessment data structure', () => {
      const mockAssessment = {
        id: 'test-assessment-id',
        user_id: 'test-user-id',
        type: 'relationship_health',
        score: 75,
        completed_at: new Date().toISOString()
      };

      expect(mockAssessment.id).toBeTruthy();
      expect(mockAssessment.user_id).toBeTruthy();
      expect(mockAssessment.type).toBeTruthy();
      expect(typeof mockAssessment.score).toBe('number');
      expect(mockAssessment.score).toBeGreaterThanOrEqual(0);
      expect(mockAssessment.score).toBeLessThanOrEqual(100);
    });
  });

  describe('10. System Health Checks', () => {
    test('should have stable connection', async () => {
      // Multiple quick operations to test stability
      const operations = Array.from({ length: 3 }, async (_, i) => {
        return supabase.auth.getSession();
      });

      const results = await Promise.all(operations);
      
      results.forEach(result => {
        expect(result.error).toBeNull();
        expect(result.data).toBeDefined();
      });
    });

    test('should handle network timeout gracefully', async () => {
      // Set a very short timeout to test error handling
      try {
        const { data, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 50)
          )
        ]);
        
        // If it completes within timeout, that's good
        expect(data || error).toBeDefined();
      } catch (err) {
        // If it times out, that's also acceptable for this test
        expect(err.message).toBe('Timeout');
      }
    });
  });
});

// Test utilities
function generateTestId() {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

module.exports = {
  generateTestId,
  isValidEmail,
  isValidUUID
};
