import React from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/ui/Button";
import ProgressBar from "../../../components/ui/ProgressBar";

const AssessmentHeader = ({
  currentQuestion,
  totalQuestions,
  progress,
  onExit,
}) => {
  const navigate = useNavigate();

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      navigate("/welcome-onboarding");
    }
  };

  return (
    <header className="bg-card border-b border-border px-4 py-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExit}
            iconName="X"
            iconSize={20}
          />
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Relationship Assessment
            </h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestion} of {totalQuestions}
            </p>
          </div>
        </div>

        <div className="hidden sm:block w-32">
          <ProgressBar
            value={progress}
            showPercentage={false}
            size="sm"
            animated={true}
            variant="primary"
          />
        </div>
      </div>

      <div className="sm:hidden">
        <ProgressBar
          value={progress}
          showPercentage={true}
          size="sm"
          animated={true}
          variant="primary"
        />
      </div>
    </header>
  );
};

export default AssessmentHeader;
