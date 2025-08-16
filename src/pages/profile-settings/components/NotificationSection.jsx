import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import { Checkbox } from "../../../components/ui/Checkbox";
import Select from "../../../components/ui/Select";

const NotificationSection = ({
  notificationSettings,
  onUpdateNotifications,
}) => {
  const [settings, setSettings] = useState(notificationSettings);

  const handleToggle = (key, value) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(newSettings);
    onUpdateNotifications(newSettings);
  };

  const timeOptions = [
    { value: "08:00", label: "8:00 AM" },
    { value: "09:00", label: "9:00 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "18:00", label: "6:00 PM" },
    { value: "19:00", label: "7:00 PM" },
    { value: "20:00", label: "8:00 PM" },
  ];

  const frequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  const notificationTypes = [
    {
      key: "dailyReminders",
      label: "Daily Practice Reminders",
      description: "Get reminded to complete your daily relationship practices",
      checked: settings?.dailyReminders,
    },
    {
      key: "progressUpdates",
      label: "Progress Updates",
      description: "Weekly summaries of your relationship development progress",
      checked: settings?.progressUpdates,
    },
    {
      key: "achievementAlerts",
      label: "Achievement Notifications",
      description: "Celebrate milestones and completed goals",
      checked: settings?.achievementAlerts,
    },
    {
      key: "insightNotifications",
      label: "New Insights Available",
      description: "Be notified when new personalized insights are ready",
      checked: settings?.insightNotifications,
    },
  ];

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
          <Icon name="Bell" size={20} className="text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Manage your notification preferences
          </p>
        </div>
      </div>
      <div className="space-y-6">
        {notificationTypes?.map((type) => (
          <div key={type?.key} className="flex items-start space-x-4">
            <Checkbox
              checked={type?.checked}
              onChange={(e) => handleToggle(type?.key, e?.target?.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label className="font-medium text-foreground cursor-pointer">
                {type?.label}
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                {type?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {settings?.dailyReminders && (
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Reminder Time"
              options={timeOptions}
              value={settings?.reminderTime}
              onChange={(value) => handleToggle("reminderTime", value)}
              placeholder="Select time"
            />
            <Select
              label="Frequency"
              options={frequencyOptions}
              value={settings?.frequency}
              onChange={(value) => handleToggle("frequency", value)}
              placeholder="Select frequency"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSection;
