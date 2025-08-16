import { supabase } from "../pages/login-authentication/components/supabaseClient";
import {
  User,
  Assessment,
  Practice,
  Goal,
  Progress,
  CreateAssessmentRequest,
  SubmitAssessmentRequest,
  CreateGoalRequest,
  UpdateGoalRequest,
  AsyncActionResult,
  Answer,
} from "./types";

// Enhanced error handling
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Generic API wrapper with error handling
const apiWrapper = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
): Promise<AsyncActionResult<T>> => {
  try {
    const result = await operation();

    if (result.error) {
      throw new ApiError(
        result.error.message || "An error occurred",
        result.error.status,
        result.error.code,
        result.error,
      );
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error("API Error:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error("Unknown error occurred"),
    };
  }
};

// Authentication API
export const authApi = {
  signIn: async (
    email: string,
    password: string,
  ): Promise<AsyncActionResult<User>> => {
    return apiWrapper(() =>
      supabase.auth.signInWithPassword({ email, password }),
    );
  },

  signUp: async (
    email: string,
    password: string,
    metadata?: any,
  ): Promise<AsyncActionResult<User>> => {
    return apiWrapper(() =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      }),
    );
  },

  signOut: async (): Promise<AsyncActionResult<void>> => {
    return apiWrapper(() => supabase.auth.signOut());
  },

  resetPassword: async (
    email: string,
    redirectTo?: string,
  ): Promise<AsyncActionResult<void>> => {
    return apiWrapper(() =>
      supabase.auth.resetPasswordForEmail(
        email,
        redirectTo ? { redirectTo } : undefined,
      ),
    );
  },

  updatePassword: async (
    password: string,
  ): Promise<AsyncActionResult<User>> => {
    return apiWrapper(() => supabase.auth.updateUser({ password }));
  },

  updateProfile: async (
    updates: Partial<User["user_metadata"]>,
  ): Promise<AsyncActionResult<User>> => {
    return apiWrapper(() => supabase.auth.updateUser({ data: updates }));
  },

  getCurrentUser: async (): Promise<AsyncActionResult<User>> => {
    return apiWrapper(async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      return { data: user, error };
    });
  },

  refreshSession: async (): Promise<AsyncActionResult<User>> => {
    return apiWrapper(async () => {
      const { data, error } = await supabase.auth.refreshSession();
      return { data: data.user, error };
    });
  },
};

// Assessments API
export const assessmentsApi = {
  getAll: async (): Promise<AsyncActionResult<Assessment[]>> => {
    return apiWrapper(() =>
      supabase
        .from("assessments")
        .select("*")
        .order("created_at", { ascending: false }),
    );
  },

  getById: async (id: string): Promise<AsyncActionResult<Assessment>> => {
    return apiWrapper(() =>
      supabase.from("assessments").select("*").eq("id", id).single(),
    );
  },

  create: async (
    assessment: CreateAssessmentRequest,
  ): Promise<AsyncActionResult<Assessment>> => {
    return apiWrapper(() =>
      supabase.from("assessments").insert(assessment).select().single(),
    );
  },

  submit: async (
    submission: SubmitAssessmentRequest,
  ): Promise<AsyncActionResult<Assessment>> => {
    return apiWrapper(async () => {
      // Insert answers
      const { error: answersError } = await supabase
        .from("assessment_answers")
        .insert(
          submission.answers.map((answer) => ({
            ...answer,
            assessment_id: submission.assessmentId,
          })),
        );

      if (answersError) throw answersError;

      // Update assessment as completed
      const { data, error } = await supabase
        .from("assessments")
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", submission.assessmentId)
        .select()
        .single();

      return { data, error };
    });
  },

  delete: async (id: string): Promise<AsyncActionResult<void>> => {
    return apiWrapper(() => supabase.from("assessments").delete().eq("id", id));
  },
};

// Practices API
export const practicesApi = {
  getAll: async (): Promise<AsyncActionResult<Practice[]>> => {
    return apiWrapper(() =>
      supabase.from("practices").select("*").order("title"),
    );
  },

  getById: async (id: string): Promise<AsyncActionResult<Practice>> => {
    return apiWrapper(() =>
      supabase.from("practices").select("*").eq("id", id).single(),
    );
  },

  getByCategory: async (
    category: string,
  ): Promise<AsyncActionResult<Practice[]>> => {
    return apiWrapper(() =>
      supabase
        .from("practices")
        .select("*")
        .eq("category", category)
        .order("title"),
    );
  },

  markCompleted: async (
    practiceId: string,
    rating?: number,
    notes?: string,
  ): Promise<AsyncActionResult<Progress>> => {
    return apiWrapper(() =>
      supabase
        .from("progress")
        .insert({
          practice_id: practiceId,
          completed_at: new Date().toISOString(),
          rating,
          notes,
        })
        .select()
        .single(),
    );
  },
};

// Goals API
export const goalsApi = {
  getAll: async (): Promise<AsyncActionResult<Goal[]>> => {
    return apiWrapper(() =>
      supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false }),
    );
  },

  getById: async (id: string): Promise<AsyncActionResult<Goal>> => {
    return apiWrapper(() =>
      supabase.from("goals").select("*").eq("id", id).single(),
    );
  },

  create: async (goal: CreateGoalRequest): Promise<AsyncActionResult<Goal>> => {
    return apiWrapper(() =>
      supabase.from("goals").insert(goal).select().single(),
    );
  },

  update: async (goal: UpdateGoalRequest): Promise<AsyncActionResult<Goal>> => {
    const { id, ...updates } = goal;
    return apiWrapper(() =>
      supabase
        .from("goals")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single(),
    );
  },

  delete: async (id: string): Promise<AsyncActionResult<void>> => {
    return apiWrapper(() => supabase.from("goals").delete().eq("id", id));
  },
};

// Progress API
export const progressApi = {
  getAll: async (): Promise<AsyncActionResult<Progress[]>> => {
    return apiWrapper(() =>
      supabase
        .from("progress")
        .select(
          `
        *,
        practices(*)
      `,
        )
        .order("completed_at", { ascending: false }),
    );
  },

  getByDateRange: async (
    startDate: string,
    endDate: string,
  ): Promise<AsyncActionResult<Progress[]>> => {
    return apiWrapper(() =>
      supabase
        .from("progress")
        .select(
          `
        *,
        practices(*)
      `,
        )
        .gte("completed_at", startDate)
        .lte("completed_at", endDate)
        .order("completed_at", { ascending: false }),
    );
  },

  getStatistics: async (): Promise<
    AsyncActionResult<{
      totalPractices: number;
      currentStreak: number;
      weeklyAverage: number;
      completionRate: number;
    }>
  > => {
    return apiWrapper(async () => {
      // This would be a more complex query or multiple queries
      // For now, return a placeholder structure
      const { data: allProgress, error } = await supabase
        .from("progress")
        .select("*")
        .order("completed_at", { ascending: false });

      if (error) throw error;

      // Calculate statistics (simplified)
      const totalPractices = allProgress?.length || 0;
      const currentStreak = 0; // Would calculate based on consecutive days
      const weeklyAverage = 0; // Would calculate based on last 4 weeks
      const completionRate = 0; // Would calculate based on assigned vs completed

      return {
        data: {
          totalPractices,
          currentStreak,
          weeklyAverage,
          completionRate,
        },
        error: null,
      };
    });
  },
};

// Real-time subscriptions
export const subscriptions = {
  assessments: (callback: (payload: any) => void) => {
    return supabase
      .channel("assessments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assessments" },
        callback,
      )
      .subscribe();
  },

  progress: (callback: (payload: any) => void) => {
    return supabase
      .channel("progress")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "progress" },
        callback,
      )
      .subscribe();
  },

  goals: (callback: (payload: any) => void) => {
    return supabase
      .channel("goals")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals" },
        callback,
      )
      .subscribe();
  },
};

// Export all APIs
export default {
  auth: authApi,
  assessments: assessmentsApi,
  practices: practicesApi,
  goals: goalsApi,
  progress: progressApi,
  subscriptions,
};
