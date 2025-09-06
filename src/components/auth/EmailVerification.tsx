/**
 * Email Verification Component
 * Handles email verification flow and resending verification emails
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

interface EmailVerificationProps {
  email?: string;
  onVerified?: () => void;
  onSkip?: () => void;
  className?: string;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  email: propEmail,
  onVerified,
  onSkip,
  className = ''
}) => {
  const { user, resendVerification, isEmailVerified } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'sent' | 'verified' | 'error'>('pending');

  const email = propEmail || user?.email;

  useEffect(() => {
    if (isEmailVerified) {
      setVerificationStatus('verified');
      onVerified?.();
    }
  }, [isEmailVerified, onVerified]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownSeconds > 0) {
      interval = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleResendVerification = async () => {
    if (!email || cooldownSeconds > 0 || isResending) return;

    setIsResending(true);
    try {
      await resendVerification(email);
      setVerificationStatus('sent');
      setCooldownSeconds(60); // 60 second cooldown
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      setVerificationStatus('error');
      toast.error(error.message || 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (!email) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Email Required
          </h2>
          <p className="text-gray-600">
            Please provide an email address for verification.
          </p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'verified') {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Email Verified!
          </h2>
          <p className="text-gray-600">
            Your email has been successfully verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Verify Your Email
        </h2>
        
        <p className="text-gray-600 mb-4">
          We've sent a verification link to:
        </p>
        
        <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md mb-6">
          {email}
        </p>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">Please check your email and click the verification link.</p>
            <p>Don't see the email? Check your spam folder.</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={handleResendVerification}
              disabled={cooldownSeconds > 0 || isResending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
            >
              {isResending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : cooldownSeconds > 0 ? (
                `Resend in ${cooldownSeconds}s`
              ) : (
                'Resend Verification Email'
              )}
            </button>

            {onSkip && (
              <button
                onClick={handleSkip}
                className="w-full text-gray-600 py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Skip for Now
              </button>
            )}
          </div>
        </div>

        {verificationStatus === 'sent' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm text-green-800">
                Verification email sent successfully!
              </span>
            </div>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-red-800">
                Failed to send verification email. Please try again.
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <p>
            If you continue to have problems, please contact{' '}
            <a
              href="mailto:support@kasama.ai"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              support@kasama.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
