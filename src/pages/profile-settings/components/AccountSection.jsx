import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const AccountSection = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onUpdateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="User" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Account Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage your personal details
            </p>
          </div>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            iconName="Edit2"
            iconPosition="left"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>
      <div className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          value={formData?.name}
          onChange={(e) => handleInputChange("name", e?.target?.value)}
          disabled={!isEditing}
          placeholder="Enter your full name"
        />

        <Input
          label="Email Address"
          type="email"
          value={formData?.email}
          onChange={(e) => handleInputChange("email", e?.target?.value)}
          disabled={!isEditing}
          placeholder="Enter your email address"
        />

        <Input
          label="Phone Number"
          type="tel"
          value={formData?.phone}
          onChange={(e) => handleInputChange("phone", e?.target?.value)}
          disabled={!isEditing}
          placeholder="Enter your phone number"
          description="Optional - for account recovery"
        />

        {isEditing && (
          <div className="flex space-x-3 pt-4">
            <Button
              variant="default"
              onClick={handleSave}
              loading={isLoading}
              iconName="Check"
              iconPosition="left"
              className="flex-1"
            >
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              iconName="X"
              iconPosition="left"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <Button
          variant="outline"
          iconName="Key"
          iconPosition="left"
          onClick={() => {
            // Handle password change
          }}
        >
          Change Password
        </Button>
      </div>
    </div>
  );
};

export default AccountSection;
