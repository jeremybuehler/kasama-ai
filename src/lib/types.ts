// Core application types and interfaces
import React from "react";

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  userId: string;
  completed: boolean;
  score?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  type: "multiple-choice" | "scale" | "text" | "boolean";
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  required: boolean;
  order: number;
}

export interface Answer {
  questionId: string;
  value: string | number | boolean;
  assessmentId: string;
}

export interface Practice {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // in minutes
  difficulty: "beginner" | "intermediate" | "advanced";
  instructions: string;
  benefits: string[];
  completed?: boolean;
  completedAt?: string;
}

export interface Progress {
  id: string;
  userId: string;
  practiceId: string;
  completedAt: string;
  rating?: number;
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  completed: boolean;
  progress: number; // 0-100
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  userId: string;
  createdAt: string;
}

// Component prop types
export interface ButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "success"
    | "warning"
    | "danger";
  size?: "default" | "sm" | "lg" | "icon" | "xs" | "xl";
  asChild?: boolean;
  loading?: boolean;
  iconName?: string;
  iconPosition?: "left" | "right";
  iconSize?: number;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

// Store types
export interface AppStore {
  // Auth state
  user: User | null;
  authLoading: boolean;

  // UI state
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  notifications: Notification[];

  // Data state
  assessments: Assessment[];
  practices: Practice[];
  goals: Goal[];
  progress: Progress[];

  // Actions
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt">,
  ) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  setAssessments: (assessments: Assessment[]) => void;
  setPractices: (practices: Practice[]) => void;
  setGoals: (goals: Goal[]) => void;
  setProgress: (progress: Progress[]) => void;
}

// API types
export interface CreateAssessmentRequest {
  title: string;
  description: string;
  questions: Omit<Question, "id">[];
}

export interface SubmitAssessmentRequest {
  assessmentId: string;
  answers: Answer[];
}

export interface CreateGoalRequest {
  title: string;
  description: string;
  category: string;
  targetDate: string;
}

export interface UpdateGoalRequest extends Partial<CreateGoalRequest> {
  id: string;
  completed?: boolean;
  progress?: number;
}

// Utility types
export type LoadingState<T = any> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type AsyncActionResult<T = any> = {
  data: T | null;
  error: Error | null;
};

// Event types
export type NavigationEvent = {
  path: string;
  state?: any;
};

export type AssessmentEvent = {
  type: "started" | "completed" | "abandoned";
  assessmentId: string;
  timestamp: string;
};

export type PracticeEvent = {
  type: "started" | "completed" | "skipped";
  practiceId: string;
  duration?: number;
  rating?: number;
  timestamp: string;
};

// Filter and sort types
export type SortOrder = "asc" | "desc";

export interface FilterOptions {
  category?: string;
  difficulty?: string;
  completed?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SortOptions {
  field: string;
  order: SortOrder;
}

// Chart and visualization types
export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  category?: string;
}

export interface ProgressChartData {
  daily: ChartDataPoint[];
  weekly: ChartDataPoint[];
  monthly: ChartDataPoint[];
}

// Theme and styling types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ComponentVariants {
  [key: string]: {
    [variant: string]: string;
  };
}

// Add missing ErrorBoundaryState interface
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}
