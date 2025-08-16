import React, { useEffect } from "react";
import Icon from "../AppIcon";
import Button from "./Button";

const ProfileModal = ({ isOpen = false, onClose, user = {} }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e?.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      onClose();
    }
  };

  const profileMenuItems = [
    {
      id: "profile",
      label: "Profile Settings",
      path: "/profile-settings",
      icon: "User",
      description: "Manage your account and preferences",
    },
    {
      id: "assessment",
      label: "Retake Assessment",
      path: "/relationship-assessment",
      icon: "FileText",
      description: "Update your relationship profile",
    },
    {
      id: "privacy",
      label: "Privacy & Security",
      path: "/privacy-settings",
      icon: "Shield",
      description: "Control your data and security settings",
    },
    {
      id: "help",
      label: "Help & Support",
      path: "/help-support",
      icon: "HelpCircle",
      description: "Get help and contact support",
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center"
      onClick={handleBackdropClick}
    >
      {/* Mobile: Full screen modal */}
      <div className="lg:hidden w-full bg-card rounded-t-xl animate-slide-in max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xl">
                {user?.name ? user?.name?.charAt(0)?.toUpperCase() : "U"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {user?.name || "User Name"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {profileMenuItems?.map((item) => (
            <button
              key={item?.id}
              onClick={() => {
                onClose();
                // Handle navigation here
              }}
              className="w-full flex items-center space-x-4 p-4 rounded-lg hover:bg-muted transition-gentle text-left"
            >
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Icon
                  name={item?.icon}
                  size={20}
                  className="text-muted-foreground"
                />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">{item?.label}</div>
                <div className="text-sm text-muted-foreground">
                  {item?.description}
                </div>
              </div>
              <Icon
                name="ChevronRight"
                size={16}
                className="text-muted-foreground"
              />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button
            variant="outline"
            fullWidth
            iconName="LogOut"
            iconPosition="left"
            onClick={() => {
              onClose();
              // Handle logout
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>
      {/* Desktop: Centered modal */}
      <div className="hidden lg:block w-full max-w-md bg-card rounded-xl shadow-large animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.name ? user?.name?.charAt(0)?.toUpperCase() : "U"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {user?.name || "User Name"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-1">
          {profileMenuItems?.map((item) => (
            <button
              key={item?.id}
              onClick={() => {
                onClose();
                // Handle navigation here
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-gentle text-left"
            >
              <Icon
                name={item?.icon}
                size={18}
                className="text-muted-foreground"
              />
              <span className="font-medium text-foreground">{item?.label}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            fullWidth
            iconName="LogOut"
            iconPosition="left"
            onClick={() => {
              onClose();
              // Handle logout
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
