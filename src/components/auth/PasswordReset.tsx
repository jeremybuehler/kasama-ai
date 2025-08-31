import React, { useState, memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import Button from "../ui/Button";
import { cn, focusRing, transitions } from "../../utils/cn.ts";
import { useAuth } from "../../hooks/useAuth";

interface PasswordResetFormData {
  email: string;
}

interface PasswordResetFormProps {
  onRequestReset?: (email: string) => Promise<void> | void;
  className?: string;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = memo(
  ({ onRequestReset, className }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { resetPassword, resetPasswordLoading } = useAuth();

    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      setError,
      getValues,
    } = useForm<PasswordResetFormData>({
      defaultValues: {
        email: "",
      },
    });

    const onSubmit = useCallback(
      async (data: PasswordResetFormData) => {
        try {
          if (onRequestReset) {
            await onRequestReset(data.email);
          } else {
            const { error } = await resetPassword(data.email);
            if (error) {
              setError("root", {
                message:
                  error.message ||
                  "Failed to send reset email. Please try again.",
              });
              return;
            }
          }

          setIsSubmitted(true);
        } catch (error) {
          setError("root", {
            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
          });
        }
      },
      [onRequestReset, resetPassword, setError],
    );

    const handleResend = useCallback(async () => {
      const email = getValues("email");
      if (email) {
        try {
          if (onRequestReset) {
            await onRequestReset(email);
          } else {
            await resetPassword(email);
          }
        } catch (error) {
          console.error("Failed to resend reset email:", error);
        }
      }
    }, [getValues, onRequestReset, resetPassword]);

    const isLoading = isSubmitting || resetPasswordLoading;

    if (isSubmitted) {
      return (
        <div className={cn("w-full max-w-md mx-auto text-center", className)}>
          <div className="space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-success" />
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Check your email
              </h2>
              <p className="text-muted-foreground">
                We've sent a password reset link to{" "}
                <strong>{getValues("email")}</strong>. Please check your email
                and follow the instructions to reset your password.
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-4 text-left bg-muted/30 rounded-lg p-4">
              <h3 className="font-medium text-foreground">What to do next:</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the "Reset Password" link in the email</li>
                <li>Create a new password</li>
                <li>Sign in with your new password</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleResend}
                variant="outline"
                fullWidth
                disabled={isLoading}
              >
                Resend email
              </Button>

              <Link to="/login">
                <Button
                  variant="ghost"
                  fullWidth
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>

            {/* Support */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or{" "}
                <a
                  href="mailto:support@kasama.ai"
                  className="text-primary hover:underline"
                >
                  contact support
                </a>
              </p>
            </div>
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
              Reset your password
            </h1>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          {/* Form */}
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
                autoFocus
              />
              {errors.email && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.email.message}
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
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>

            {/* Back to Sign In */}
            <Link to="/login">
              <Button
                variant="ghost"
                fullWidth
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Button>
            </Link>
          </form>

          {/* Help */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Need help?{" "}
              <a
                href="mailto:support@kasama.ai"
                className="text-primary hover:underline"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  },
);

PasswordResetForm.displayName = "PasswordResetForm";

export default PasswordResetForm;
