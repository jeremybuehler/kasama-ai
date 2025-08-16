import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import { Checkbox } from "../../../components/ui/Checkbox";
import Button from "../../../components/ui/Button";

const PrivacySection = ({ privacySettings, onUpdatePrivacy }) => {
  const [settings, setSettings] = useState(privacySettings);

  const handleToggle = (key, value) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(newSettings);
    onUpdatePrivacy(newSettings);
  };

  const privacyOptions = [
    {
      key: "dataSharing",
      label: "Data Sharing for Insights",
      description: "Allow anonymized data to improve AI recommendations",
      checked: settings?.dataSharing,
    },
    {
      key: "assessmentVisibility",
      label: "Assessment Results Visibility",
      description: "Keep assessment results private to your account only",
      checked: settings?.assessmentVisibility,
    },
    {
      key: "progressSharing",
      label: "Progress Analytics",
      description: "Share progress data to help improve the app experience",
      checked: settings?.progressSharing,
    },
    {
      key: "marketingEmails",
      label: "Marketing Communications",
      description: "Receive updates about new features and relationship tips",
      checked: settings?.marketingEmails,
    },
  ];

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
          <Icon name="Shield" size={20} className="text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Privacy & Data</h3>
          <p className="text-sm text-muted-foreground">
            Control how your data is used
          </p>
        </div>
      </div>
      <div className="space-y-6">
        {privacyOptions?.map((option) => (
          <div key={option?.key} className="flex items-start space-x-4">
            <Checkbox
              checked={option?.checked}
              onChange={(e) => handleToggle(option?.key, e?.target?.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label className="font-medium text-foreground cursor-pointer">
                {option?.label}
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                {option?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-foreground">Data Export</h4>
            <p className="text-sm text-muted-foreground">
              Download all your data
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
            onClick={() => {
              // Handle data export
            }}
          >
            Export Data
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySection;
