import React from "react";
import Icon from "../../../components/AppIcon";

const SupportSection = () => {
  const supportOptions = [
    {
      id: "faq",
      title: "Frequently Asked Questions",
      description: "Find answers to common questions about Kasama",
      icon: "HelpCircle",
      action: () => {
        // Handle FAQ navigation
      },
    },
    {
      id: "contact",
      title: "Contact Support",
      description: "Get help from our support team",
      icon: "MessageCircle",
      action: () => {
        // Handle contact support
      },
    },
    {
      id: "feedback",
      title: "Send Feedback",
      description: "Share your thoughts and suggestions",
      icon: "Star",
      action: () => {
        // Handle feedback submission
      },
    },
    {
      id: "community",
      title: "Community Guidelines",
      description: "Learn about our community standards",
      icon: "Users",
      action: () => {
        // Handle community guidelines
      },
    },
  ];

  const legalLinks = [
    {
      id: "privacy",
      title: "Privacy Policy",
      action: () => {
        // Handle privacy policy
      },
    },
    {
      id: "terms",
      title: "Terms of Service",
      action: () => {
        // Handle terms of service
      },
    },
    {
      id: "cookies",
      title: "Cookie Policy",
      action: () => {
        // Handle cookie policy
      },
    },
  ];

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon name="LifeBuoy" size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Help & Support</h3>
          <p className="text-sm text-muted-foreground">
            Get assistance and resources
          </p>
        </div>
      </div>
      <div className="space-y-4 mb-6">
        {supportOptions?.map((option) => (
          <button
            key={option?.id}
            onClick={option?.action}
            className="w-full flex items-center space-x-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-gentle text-left"
          >
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon
                name={option?.icon}
                size={20}
                className="text-muted-foreground"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{option?.title}</h4>
              <p className="text-sm text-muted-foreground">
                {option?.description}
              </p>
            </div>
            <Icon
              name="ChevronRight"
              size={16}
              className="text-muted-foreground"
            />
          </button>
        ))}
      </div>
      <div className="pt-6 border-t border-border">
        <h4 className="font-medium text-foreground mb-4">Legal & Policies</h4>
        <div className="flex flex-wrap gap-4">
          {legalLinks?.map((link) => (
            <button
              key={link?.id}
              onClick={link?.action}
              className="text-sm text-primary hover:text-primary/80 transition-gentle"
            >
              {link?.title}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-semibold text-xl">K</span>
          </div>
          <h4 className="font-semibold text-foreground mb-2">Kasama</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Version 1.0.0 • Built with ❤️ for better relationships
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <span>© 2025 Kasama</span>
            <span>•</span>
            <span>Made with care</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportSection;
