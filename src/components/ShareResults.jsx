/**
 * Share Results Component - MVP Implementation
 * Enables sharing of assessment results and achievements
 */

import React, { useState } from "react";
import Icon from "./AppIcon";
import Button from "./ui/Button";

const ShareResults = ({
  results,
  type = "assessment",
  onClose,
  className = "",
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const generateShareText = () => {
    if (type === "assessment" && results.shareableResults) {
      const { overallScore, readinessLevel, message } =
        results.shareableResults;
      return `I just completed my relationship readiness assessment on Kasama AI! 🌟\n\nScore: ${overallScore}/100\nLevel: ${readinessLevel}\n\n${message}\n\nBuilding stronger connections through personal growth! #RelationshipGrowth #PersonalDevelopment`;
    }

    if (type === "achievement" && results.title) {
      return `Just unlocked "${results.title}" on Kasama AI! ${results.icon}\n\n${results.description}\n\nEvery step forward counts in building better relationships! #Achievement #RelationshipGrowth`;
    }

    if (type === "milestone" && results) {
      return `Celebrating my relationship development journey! 🎉\n\nCompleted ${results.totalActivities} activities\n${results.currentStreak} day practice streak\n\nBuilding relationship skills one practice at a time! #PersonalGrowth #Relationships`;
    }

    return "Building stronger relationships with Kasama AI! Join me on this growth journey. 🌱 #RelationshipGrowth";
  };

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/welcome-onboarding?ref=share`;
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      setIsSharing(true);
      try {
        await navigator.share({
          title: "Kasama AI - Relationship Development",
          text: generateShareText(),
          url: generateShareUrl(),
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
          // Fallback to copy to clipboard
          await handleCopyToClipboard();
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      await handleCopyToClipboard();
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const shareText = `${generateShareText()}\n\n${generateShareUrl()}`;
      await navigator.clipboard.writeText(shareText);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      // Fallback for older browsers
      fallbackCopyToClipboard(
        `${generateShareText()}\n\n${generateShareUrl()}`,
      );
    }
  };

  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error("Fallback copy failed:", error);
    }

    document.body.removeChild(textArea);
  };

  const handleSocialShare = (platform) => {
    const text = encodeURIComponent(generateShareText());
    const url = encodeURIComponent(generateShareUrl());

    const socialUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      instagram: `https://www.instagram.com/`, // Instagram doesn't support direct URL sharing
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      reddit: `https://reddit.com/submit?url=${url}&title=${encodeURIComponent("My Relationship Development Journey")}`,
    };

    if (socialUrls[platform]) {
      window.open(socialUrls[platform], "_blank", "width=600,height=400");
    }
  };

  const getResultsPreview = () => {
    if (type === "assessment" && results.shareableResults) {
      return (
        <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {results.shareableResults.overallScore}/100
          </div>
          <div className="font-medium text-foreground mb-1">
            {results.shareableResults.readinessLevel}
          </div>
          <div className="text-sm text-muted-foreground">
            {results.shareableResults.message}
          </div>
        </div>
      );
    }

    if (type === "achievement") {
      return (
        <div className="bg-warning/10 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">{results.icon}</div>
          <div className="font-medium text-foreground mb-1">
            {results.title}
          </div>
          <div className="text-sm text-muted-foreground">
            {results.description}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-success/10 rounded-lg p-4 text-center">
        <div className="text-2xl mb-2">🌱</div>
        <div className="font-medium text-foreground">
          Relationship Growth Journey
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results Preview */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">
          Share Your Progress
        </h3>
        {getResultsPreview()}
      </div>

      {/* Quick Share */}
      <div className="space-y-3">
        <Button
          fullWidth
          onClick={handleWebShare}
          disabled={isSharing}
          iconName={isSharing ? "Loader" : "Share"}
          iconPosition="left"
          className={isSharing ? "animate-pulse" : ""}
        >
          {isSharing
            ? "Sharing..."
            : navigator.share
              ? "Share"
              : "Copy to Share"}
        </Button>

        {showCopySuccess && (
          <div className="text-center text-sm text-success flex items-center justify-center space-x-1">
            <Icon name="Check" size={16} />
            <span>Copied to clipboard!</span>
          </div>
        )}
      </div>

      {/* Social Media Options */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Or share on social media
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleSocialShare("twitter")}
            className="flex flex-col items-center space-y-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="text-xs text-muted-foreground">Twitter</span>
          </button>

          <button
            onClick={() => handleSocialShare("facebook")}
            className="flex flex-col items-center space-y-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">f</span>
            </div>
            <span className="text-xs text-muted-foreground">Facebook</span>
          </button>

          <button
            onClick={() => handleSocialShare("linkedin")}
            className="flex flex-col items-center space-y-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">in</span>
            </div>
            <span className="text-xs text-muted-foreground">LinkedIn</span>
          </button>

          <button
            onClick={() => handleSocialShare("whatsapp")}
            className="flex flex-col items-center space-y-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Icon name="MessageCircle" size={16} className="text-white" />
            </div>
            <span className="text-xs text-muted-foreground">WhatsApp</span>
          </button>

          <button
            onClick={() => handleSocialShare("reddit")}
            className="flex flex-col items-center space-y-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <span className="text-xs text-muted-foreground">Reddit</span>
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="flex flex-col items-center space-y-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
              <Icon name="Copy" size={16} className="text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Copy</span>
          </button>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <Icon
            name="Shield"
            size={16}
            className="text-muted-foreground mt-0.5"
          />
          <div>
            <p className="text-xs text-muted-foreground">
              <strong>Privacy Note:</strong> Only general progress metrics are
              shared. Your detailed assessment responses and personal insights
              remain private.
            </p>
          </div>
        </div>
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="pt-4 border-t border-border">
          <Button variant="outline" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShareResults;
