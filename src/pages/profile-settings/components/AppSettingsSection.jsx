import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Select from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";

const AppSettingsSection = ({ appSettings, onUpdateAppSettings }) => {
  const [settings, setSettings] = useState(appSettings);

  const handleChange = (key, value) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(newSettings);
    onUpdateAppSettings(newSettings);
  };

  const themeOptions = [
    { value: "light", label: "Light Theme" },
    { value: "dark", label: "Dark Theme" },
    { value: "system", label: "System Default" },
  ];

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
  ];

  const timezoneOptions = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
    { value: "Europe/Paris", label: "Central European Time (CET)" },
  ];

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
          <Icon name="Settings" size={20} className="text-secondary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">App Settings</h3>
          <p className="text-sm text-muted-foreground">
            Customize your app experience
          </p>
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Theme"
            options={themeOptions}
            value={settings?.theme}
            onChange={(value) => handleChange("theme", value)}
            placeholder="Select theme"
          />

          <Select
            label="Language"
            options={languageOptions}
            value={settings?.language}
            onChange={(value) => handleChange("language", value)}
            placeholder="Select language"
          />
        </div>

        <Select
          label="Timezone"
          options={timezoneOptions}
          value={settings?.timezone}
          onChange={(value) => handleChange("timezone", value)}
          placeholder="Select your timezone"
          searchable
        />

        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <Checkbox
              checked={settings?.autoSave}
              onChange={(e) => handleChange("autoSave", e?.target?.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label className="font-medium text-foreground cursor-pointer">
                Auto-save Progress
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically save your assessment and practice progress
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <Checkbox
              checked={settings?.offlineMode}
              onChange={(e) => handleChange("offlineMode", e?.target?.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label className="font-medium text-foreground cursor-pointer">
                Offline Mode
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                Enable offline access to practices and insights
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <Checkbox
              checked={settings?.analytics}
              onChange={(e) => handleChange("analytics", e?.target?.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label className="font-medium text-foreground cursor-pointer">
                Usage Analytics
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                Help improve the app by sharing anonymous usage data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSettingsSection;
