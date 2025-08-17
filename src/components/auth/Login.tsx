import React, { useState, memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Button from "../ui/Button";
import { cn, focusRing, transitions } from "../../utils/cn";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../ui/LoadingSpinner";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginFormProps {
  onLogin?: (email: string, password: string) => Promise<void> | void;
  onForgotPassword?: () => void;
  className?: string;
}

const LoginForm: React.FC<LoginFormProps> = memo(({
  onLogin,
  onForgotPassword,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = useCallback(async (data: LoginFormData) => {
    try {
      if (onLogin) {
        await onLogin(data.email, data.password);
      } else {
        const { error } = await login(data.email, data.password);
        if (error) {
          setError("root", {
            message:
              error.message || "Login failed. Please check your credentials.",
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
  }, [onLogin, login, setError, reset]);

  const isLoading = isSubmitting || loginLoading;

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              focusRing,
              transitions.colors,
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
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              placeholder="Enter your password"
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
              onClick={useCallback(() => setShowPassword(!showPassword), [showPassword])}
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
          {errors.password && (
            <p className="text-sm text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              {...register("rememberMe")}
              type="checkbox"
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-0"
              disabled={isLoading}
            />
            <span className="text-sm text-muted-foreground">Remember me</span>
          </label>

          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-primary hover:underline focus:outline-none focus:underline"
              disabled={isLoading}
            >
              Forgot password?
            </button>
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
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary hover:underline focus:outline-none focus:underline"
          >
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
});

LoginForm.displayName = 'LoginForm';

export default LoginForm;
