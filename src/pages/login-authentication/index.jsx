import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, User } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Checkbox } from "../../components/ui/Checkbox";

import DemoAccountSection from "./components/DemoAccountSection";
import SocialAuthButtons from "./components/SocialAuthButtons";
import { useAuth } from "../../hooks/useAuth";

const LoginAuthentication = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (formData) => {
    setLoading(true);
    setAuthError("");

    try {
      const { data, error } = await signIn(formData?.email, formData?.password);

      if (error) {
        setAuthError(error?.message);
        return;
      }

      if (data?.user) {
        // Successful login - navigate to dashboard
        navigate("/dashboard-home");
      }
    } catch (error) {
      setAuthError("An unexpected error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setValue("email", "pamela.buehler@example.com");
    setValue("password", "demopassword123");
    setAuthError("");
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password or show modal
    console.log("Forgot password clicked");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-large p-8 space-y-6"
        >
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-medium"
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>

            <div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to your Kasama account to continue your relationship
                intelligence journey
              </p>
            </div>
          </div>

          {/* Error Display */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <p className="text-red-700 text-sm">{authError}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(handleSignIn)} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Please enter a valid email address",
                  },
                })}
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                error={errors?.email?.message}
                required
                className="transition-gentle"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="Enter your password"
                  error={errors?.password?.message}
                  required
                  className="pr-12 transition-gentle"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e?.target?.checked)}
                label="Remember Me"
                className="text-sm"
              />

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="bg-gradient-primary hover:opacity-90 transition-smooth"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Demo Account Section */}
          <DemoAccountSection onDemoLogin={handleDemoLogin} />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Authentication */}
          <SocialAuthButtons />

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/sign-up")}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Create Account
              </button>
            </p>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-center space-y-2"
        >
          <p className="text-xs text-gray-500">
            Secured with 256-bit SSL encryption
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>🔒 Your data is protected</span>
            <span>•</span>
            <span>✓ GDPR Compliant</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginAuthentication;
