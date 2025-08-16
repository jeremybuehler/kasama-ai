import React, { useState } from "react";
import Icon from "../AppIcon";

const BottomTabNavigation = ({ activeTab = "home", onTabChange }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const navigationItems = [
    {
      id: "home",
      label: "Home",
      path: "/dashboard-home",
      icon: "Home",
    },
    {
      id: "learn",
      label: "Learn",
      path: "/learn-practices",
      icon: "BookOpen",
    },
    {
      id: "progress",
      label: "Progress",
      path: "/progress-tracking",
      icon: "TrendingUp",
    },
  ];

  const handleTabChange = (tabId, path) => {
    setCurrentTab(tabId);
    if (onTabChange) {
      onTabChange(tabId, path);
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around px-4 py-2">
          {navigationItems?.map((item) => (
            <button
              key={item?.id}
              onClick={() => handleTabChange(item?.id, item?.path)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-gentle min-w-[64px] ${
                currentTab === item?.id
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon
                name={item?.icon}
                size={20}
                className={`mb-1 ${currentTab === item?.id ? "text-primary" : ""}`}
              />
              <span
                className={`text-xs font-medium ${
                  currentTab === item?.id ? "text-primary" : ""
                }`}
              >
                {item?.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-64 lg:bg-card lg:border-r lg:border-border lg:flex-col lg:z-40">
        {/* Logo Section */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">K</span>
            </div>
            <span className="text-xl font-semibold text-foreground">
              Kasama
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {navigationItems?.map((item) => (
              <button
                key={item?.id}
                onClick={() => handleTabChange(item?.id, item?.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-gentle text-left ${
                  currentTab === item?.id
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon
                  name={item?.icon}
                  size={20}
                  className={
                    currentTab === item?.id ? "text-primary-foreground" : ""
                  }
                />
                <span className="font-medium">{item?.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            © 2025 Kasama
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomTabNavigation;
