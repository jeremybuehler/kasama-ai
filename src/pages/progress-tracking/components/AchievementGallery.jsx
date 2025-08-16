import React from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const AchievementGallery = ({ badges = [] }) => {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Achievement Gallery
        </h3>
        <Button
          variant="outline"
          size="sm"
          iconName="Share2"
          iconPosition="left"
        >
          Share
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges?.map((badge) => (
          <div
            key={badge?.id}
            className={`relative p-4 rounded-lg border-2 text-center transition-gentle ${
              badge?.unlocked
                ? "border-primary bg-primary/5 hover:bg-primary/10"
                : "border-border bg-muted/50"
            }`}
          >
            <div
              className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                badge?.unlocked
                  ? "bg-gradient-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon
                name={badge?.icon}
                size={24}
                className={
                  badge?.unlocked ? "text-white" : "text-muted-foreground"
                }
              />
            </div>

            <h4
              className={`font-medium text-sm mb-1 ${
                badge?.unlocked ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {badge?.title}
            </h4>

            <p
              className={`text-xs ${
                badge?.unlocked
                  ? "text-muted-foreground"
                  : "text-muted-foreground/60"
              }`}
            >
              {badge?.description}
            </p>

            {badge?.unlocked && badge?.unlockedDate && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                <Icon name="Check" size={12} className="text-white" />
              </div>
            )}

            {!badge?.unlocked && (
              <div className="absolute inset-0 bg-muted/20 rounded-lg flex items-center justify-center">
                <Icon
                  name="Lock"
                  size={16}
                  className="text-muted-foreground/60"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {badges?.filter((b) => b?.unlocked)?.length} of {badges?.length}{" "}
          badges unlocked
        </p>
      </div>
    </div>
  );
};

export default AchievementGallery;
