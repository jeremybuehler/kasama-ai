import React from "react";
import Button from "../../../components/ui/Button";

const ViewToggle = ({ activeView = "weekly", onViewChange }) => {
  const views = [
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
  ];

  return (
    <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
      {views?.map((view) => (
        <Button
          key={view?.id}
          variant={activeView === view?.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(view?.id)}
          className={`transition-gentle ${
            activeView === view?.id
              ? "bg-primary text-primary-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {view?.label}
        </Button>
      ))}
    </div>
  );
};

export default ViewToggle;
