import React, { useState, memo, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";
import Button from "../ui/Button";
import { cn, focusRing, transitions } from "../../utils/cn.ts";
import { useAuth } from "../../hooks/useAuth";

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface SignupFormProps {
  onSignup?: (
    email: string,
    password: string,
    metadata?: any,
  ) => Promise<void> | void;
  className?: string;
}

const SignupForm: React.FC<SignupFormProps> = memo(
  ({ onSignup, className }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signup, signupLoading } = useAuth();

    const {
      register,
      handleSubmit,
      watch,
      formState: { errors, isSubmitting },
      setError,
      reset,
    } = useForm<SignupFormData>({
      defaultValues: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
      },
    });

    const password = watch("password");

    // Password strength validation - memoized for performance
    const getPasswordStrength = useCallback((password: string) => {
      let score = 0;
      const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      };

      Object.values(checks).forEach((check) => {
        if (check) score++;
      });

      return { score, checks };
    }, []);

    const passwordStrength = useMemo(
      () => getPasswordStrength(password || ""),
      [getPasswordStrength, password],
    );

    const getStrengthLabel = useCallback((score: number) => {
      if (score < 2) return { label: "Weak", color: "text-destructive" };
      if (score < 4) return { label: "Fair", color: "text-warning" };
      if (score < 5) return { label: "Good", color: "text-primary" };
      return { label: "Strong", color: "text-success" };
    }, []);

    const onSubmit = useCallback(
      async (data: SignupFormData) => {
        try {
          if (onSignup) {
            await onSignup(data.email, data.password, { name: data.name });
          } else {
            const { error } = await signup(data.email, data.password, {
              name: data.name,
            });
            if (error) {
              setError("root", {
                message: error.message || "Signup failed. Please try again.",
              });
            } else {
              reset();
            }
          }
        } catch (error) {
          setError("root", {
            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
          });
        }
      },
      [onSignup, signup, setError, reset],
    );

    const isLoading = isSubmitting || signupLoading;
    const strengthInfo = useMemo(
      () => getStrengthLabel(passwordStrength.score),
      [getStrengthLabel, passwordStrength.score],
    );

    return (
      <div className={cn("w-full max-w-md mx-auto", className)}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-foreground"
            >
              Full name
            </label>
            <input
              {...register("name", {
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
              })}
              type="text"
              id="name"
              autoComplete="name"
              placeholder="Enter your full name"
              className={cn(
                "w-full px-3 py-2 rounded-md border bg-background text-foreground",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                errors.name
                  ? "border-destructive focus:ring-destructive"
                  : "border-input hover:border-ring",
              )}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Please enter a valid email address",
                },
              })}
              type="email"
              id="email"
              autoComplete="email"
              placeholder="Enter your email"
              className={cn(
                "w-full px-3 py-2 rounded-md border bg-background text-foreground",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                errors.email
                  ? "border-destructive focus:ring-destructive"
                  : "border-input hover:border-ring",
              )}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <input
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                  validate: (value) => {
                    const strength = getPasswordStrength(value);
                    if (strength.score < 3) {
                      return "Password is too weak. Please include uppercase, lowercase, numbers, and special characters.";
                    }
                    return true;
                  },
                })}
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="new-password"
                placeholder="Create a password"
                className={cn(
                  "w-full px-3 py-2 pr-10 rounded-md border bg-background text-foreground",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  errors.password
                    ? "border-destructive focus:ring-destructive"
                    : "border-input hover:border-ring",
                )}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Password strength:
                  </span>
                  <span
                    className={cn("text-xs font-medium", strengthInfo.color)}
                  >
                    {strengthInfo.label}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        passwordStrength.score >= level
                          ? passwordStrength.score < 2
                            ? "bg-destructive"
                            : passwordStrength.score < 4
                              ? "bg-warning"
                              : passwordStrength.score < 5
                                ? "bg-primary"
                                : "bg-success"
                          : "bg-muted",
                      )}
                    />
                  ))}
                </div>
                <div className="space-y-1">
                  {Object.entries(passwordStrength.checks).map(
                    ([key, passed]) => (
                      <div
                        key={key}
                        className="flex items-center space-x-2 text-xs"
                      >
                        <Check
                          className={cn(
                            "w-3 h-3",
                            passed ? "text-success" : "text-muted-foreground",
                          )}
                        />
                        <span
                          className={cn(
                            passed ? "text-success" : "text-muted-foreground",
                          )}
                        >
                          {key === "length" && "At least 8 characters"}
                          {key === "uppercase" && "One uppercase letter"}
                          {key === "lowercase" && "One lowercase letter"}
                          {key === "number" && "One number"}
                          {key === "special" && "One special character"}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {errors.password && (
              <p className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-foreground"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => {
                    if (value !== password) {
                      return "Passwords do not match";
                    }
                    return true;
                  },
                })}
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm your password"
                className={cn(
                  "w-full px-3 py-2 pr-10 rounded-md border bg-background text-foreground",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  errors.confirmPassword
                    ? "border-destructive focus:ring-destructive"
                    : "border-input hover:border-ring",
                )}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                disabled={isLoading}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                {...register("acceptTerms", {
                  required: "You must accept the terms and conditions",
                })}
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded border-input text-primary focus:ring-primary focus:ring-offset-0"
                disabled={isLoading}
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-sm text-destructive" role="alert">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {/* Error Message */}
          {errors.root && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive" role="alert">
                {errors.root.message}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="default"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>

          {/* Sign In Link */}
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline focus:outline-none focus:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    );
  },
);

SignupForm.displayName = "SignupForm";

export default SignupForm;
