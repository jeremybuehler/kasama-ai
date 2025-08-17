import React, { useState, memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Check, CheckCircle } from "lucide-react";
import Button from "../ui/Button";
import { cn, focusRing, transitions } from "../../utils/cn";
import { useAuth } from "../../hooks/useAuth";

interface UpdatePasswordFormData {
  password: string;
  confirmPassword: string;
}

interface UpdatePasswordFormProps {
  onUpdatePassword?: (newPassword: string, token?: string) => Promise<void> | void;
  token?: string;
  className?: string;
}

/**
 * Enhanced update password form with TypeScript, validation, and modern UI
 */
const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = memo(({
  onUpdatePassword,
  token,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { updateProfile, updateProfileLoading } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<UpdatePasswordFormData>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  // Password strength validation
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

  const passwordStrength = getPasswordStrength(password || "");

  const getStrengthLabel = useCallback((score: number) => {
    if (score < 2) return { label: "Weak", color: "text-destructive" };
    if (score < 4) return { label: "Fair", color: "text-warning" };
    if (score < 5) return { label: "Good", color: "text-primary" };
    return { label: "Strong", color: "text-success" };
  }, []);

  const onSubmit = useCallback(async (data: UpdatePasswordFormData) => {
    try {
      if (onUpdatePassword) {
        await onUpdatePassword(data.password, token);
      } else {
        // Use auth hook's update profile method
        const { error } = await updateProfile({ password: data.password });
        if (error) {
          setError("root", {
            message: error.message || "Failed to update password. Please try again.",
          });
          return;
        }
      }

      setIsSuccess(true);
      reset();
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  }, [onUpdatePassword, token, updateProfile, setError, reset]);

  const isLoading = isSubmitting || updateProfileLoading;
  const strengthInfo = getStrengthLabel(passwordStrength.score);

  if (isSuccess) {
    return (
      <div className={cn("w-full max-w-md mx-auto text-center", className)}>
        <div className="space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Password Updated
            </h2>
            <p className="text-muted-foreground">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => window.location.href = '/login'}
            variant="default"
            size="lg"
            fullWidth
          >
            Continue to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Update Your Password
          </h1>
          <p className="text-muted-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* New Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              New Password
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
                placeholder="Create a strong password"
                className={cn(
                  "w-full px-3 py-2 pr-10 rounded-md border bg-background text-foreground",
                  "placeholder:text-muted-foreground",
                  focusRing,
                  transitions.colors,
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
                className={cn(
                  "absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground",
                  focusRing,
                  transitions.colors
                )}
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
                  <span className={cn("text-xs font-medium", strengthInfo.color)}>
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
              Confirm Password
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
                  focusRing,
                  transitions.colors,
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
                className={cn(
                  "absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground",
                  focusRing,
                  transitions.colors
                )}
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
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
});

UpdatePasswordForm.displayName = 'UpdatePasswordForm';

export default UpdatePasswordForm;
