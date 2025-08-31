import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { SparkleEffect } from "../../../components/ui/ConfettiCelebration";

const AchievementGallery = ({ badges = [] }) => {
  const [recentlyUnlocked, setRecentlyUnlocked] = useState(null);
  const [hoveredBadge, setHoveredBadge] = useState(null);

  // Mock data with more delightful achievements
  const mockBadges = [
    {
      id: "first-assessment",
      title: "Self-Discovery Champion",
      description: "Completed your first relationship assessment",
      icon: "Award",
      unlocked: true,
      unlockedDate: "2024-01-15",
      rarity: "common"
    },
    {
      id: "streak-warrior",
      title: "Consistency Warrior",
      description: "Maintained a 7-day practice streak",
      icon: "Flame",
      unlocked: true,
      unlockedDate: "2024-01-18",
      rarity: "uncommon"
    },
    {
      id: "communication-master",
      title: "Communication Guru",
      description: "Mastered 5 communication techniques",
      icon: "MessageCircle",
      unlocked: true,
      unlockedDate: "2024-01-20",
      rarity: "rare"
    },
    {
      id: "empathy-expert",
      title: "Empathy Expert",
      description: "Demonstrated exceptional emotional intelligence",
      icon: "Heart",
      unlocked: false,
      rarity: "epic"
    },
    {
      id: "relationship-sage",
      title: "Relationship Sage",
      description: "Achieved mastery in all relationship dimensions",
      icon: "Crown",
      unlocked: false,
      rarity: "legendary"
    },
    {
      id: "growth-mindset",
      title: "Growth Mindset Champion",
      description: "Showed remarkable personal growth",
      icon: "TrendingUp",
      unlocked: true,
      unlockedDate: "2024-01-22",
      rarity: "rare"
    }
  ];

  const displayBadges = badges.length > 0 ? badges : mockBadges;

  const getRarityColors = (rarity) => {
    switch (rarity) {
      case "legendary": return "from-yellow-400 to-orange-500";
      case "epic": return "from-purple-400 to-pink-500";
      case "rare": return "from-blue-400 to-purple-500";
      case "uncommon": return "from-green-400 to-blue-500";
      default: return "from-gray-400 to-gray-500";
    }
  };

  const getRarityGlow = (rarity) => {
    switch (rarity) {
      case "legendary": return "shadow-yellow-400/50";
      case "epic": return "shadow-purple-400/50";
      case "rare": return "shadow-blue-400/50";
      case "uncommon": return "shadow-green-400/50";
      default: return "shadow-gray-400/50";
    }
  };

  const handleBadgeClick = (badge) => {
    if (badge.unlocked) {
      setRecentlyUnlocked(badge.id);
      setTimeout(() => setRecentlyUnlocked(null), 2000);
    }
  };
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
        {displayBadges?.map((badge) => (
          <SparkleEffect trigger={recentlyUnlocked === badge?.id}>
            <div
              key={badge?.id}
              className={`relative p-4 rounded-lg border-2 text-center transition-all duration-300 cursor-pointer group ${
                badge?.unlocked
                  ? `border-primary bg-primary/5 hover:bg-primary/10 hover:scale-105 hover:shadow-lg ${getRarityGlow(badge?.rarity)}`
                  : "border-border bg-muted/50 hover:bg-muted/70"
              }`}
              onClick={() => handleBadgeClick(badge)}
              onMouseEnter={() => setHoveredBadge(badge?.id)}
              onMouseLeave={() => setHoveredBadge(null)}
            >
              <div
                className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                  badge?.unlocked
                    ? `bg-gradient-to-r ${getRarityColors(badge?.rarity)} text-white group-hover:animate-celebration-bounce group-hover:shadow-lg`
                    : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                }`}
              >
                <Icon
                  name={badge?.icon}
                  size={24}
                  className={`transition-transform duration-200 ${
                    badge?.unlocked 
                      ? "text-white group-hover:scale-110" 
                      : "text-muted-foreground group-hover:text-muted-foreground/70"
                  }`}
                />
              </div>

              <h4
                className={`font-medium text-sm mb-1 transition-colors duration-200 ${
                  badge?.unlocked 
                    ? "text-foreground group-hover:text-primary" 
                    : "text-muted-foreground"
                }`}
              >
                {badge?.rarity === "legendary" && "🎆 "}
                {badge?.rarity === "epic" && "✨ "}
                {badge?.rarity === "rare" && "🔥 "}
                {badge?.title}
              </h4>

              <p
                className={`text-xs transition-colors duration-200 ${
                  badge?.unlocked
                    ? "text-muted-foreground group-hover:text-foreground/80"
                    : "text-muted-foreground/60"
                }`}
              >
                {badge?.description}
              </p>
              
              {badge?.unlocked && hoveredBadge === badge?.id && (
                <div className="mt-2 text-xs text-primary font-medium animate-slide-up">
                  🏆 Unlocked {new Date(badge?.unlockedDate).toLocaleDateString()}
                </div>
              )}

              {badge?.unlocked && badge?.unlockedDate && (
                <div className={`absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r ${getRarityColors(badge?.rarity)} rounded-full flex items-center justify-center animate-heart-beat shadow-lg`}>
                  <Icon name="Check" size={12} className="text-white" />
                </div>
              )}

              {!badge?.unlocked && (
                <div className="absolute inset-0 bg-muted/20 rounded-lg flex items-center justify-center group-hover:bg-muted/30 transition-colors duration-200">
                  <Icon
                    name="Lock"
                    size={16}
                    className="text-muted-foreground/60 group-hover:text-muted-foreground/80 group-hover:animate-wiggle"
                  />
                </div>
              )}
            </div>
          </SparkleEffect>
        ))}
      </div>
      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          🏅 {displayBadges?.filter((b) => b?.unlocked)?.length} of {displayBadges?.length}{" "}
          badges unlocked
        </p>
        <div className="text-xs text-muted-foreground/70">
          🎆 Legendary • ✨ Epic • 🔥 Rare • 🌟 Uncommon • ⚪ Common
        </div>
        {displayBadges?.filter((b) => b?.unlocked)?.length > 0 && (
          <p className="text-xs text-success animate-pulse">
            🎉 Amazing progress! Keep building those meaningful connections!
          </p>
        )}
      </div>
    </div>
  );
};

export default AchievementGallery;
