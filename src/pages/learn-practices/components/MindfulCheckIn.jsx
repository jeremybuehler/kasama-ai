import React, { useState } from "react";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const MindfulCheckIn = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({
    mood: null,
    energy: null,
    stress: null,
    reflection: "",
  });

  const steps = [
    {
      id: "mood",
      title: "How are you feeling right now?",
      type: "rating",
      options: [
        { value: 1, label: "Very Low", emoji: "😔", color: "text-red-500" },
        { value: 2, label: "Low", emoji: "😕", color: "text-orange-500" },
        { value: 3, label: "Neutral", emoji: "😐", color: "text-yellow-500" },
        { value: 4, label: "Good", emoji: "🙂", color: "text-green-500" },
        { value: 5, label: "Great", emoji: "😊", color: "text-emerald-500" },
      ],
    },
    {
      id: "energy",
      title: "What is your energy level?",
      type: "rating",
      options: [
        { value: 1, label: "Exhausted", emoji: "🔋", color: "text-red-500" },
        { value: 2, label: "Tired", emoji: "🔋", color: "text-orange-500" },
        { value: 3, label: "Moderate", emoji: "🔋", color: "text-yellow-500" },
        { value: 4, label: "Energetic", emoji: "🔋", color: "text-green-500" },
        {
          value: 5,
          label: "Very High",
          emoji: "⚡",
          color: "text-emerald-500",
        },
      ],
    },
    {
      id: "stress",
      title: "How stressed do you feel?",
      type: "rating",
      options: [
        {
          value: 1,
          label: "Very Calm",
          emoji: "🧘",
          color: "text-emerald-500",
        },
        { value: 2, label: "Relaxed", emoji: "😌", color: "text-green-500" },
        { value: 3, label: "Neutral", emoji: "😐", color: "text-yellow-500" },
        { value: 4, label: "Stressed", emoji: "😰", color: "text-orange-500" },
        {
          value: 5,
          label: "Very Stressed",
          emoji: "😫",
          color: "text-red-500",
        },
      ],
    },
    {
      id: "reflection",
      title: "Any thoughts or reflections?",
      type: "text",
      placeholder: "Share what's on your mind... (optional)",
    },
  ];

  const currentStepData = steps?.[currentStep];
  const isLastStep = currentStep === steps?.length - 1;

  const handleRatingSelect = (stepId, value) => {
    setResponses((prev) => ({
      ...prev,
      [stepId]: value,
    }));
  };

  const handleTextChange = (value) => {
    setResponses((prev) => ({
      ...prev,
      reflection: value,
    }));
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    const checkInData = {
      ...responses,
      timestamp: new Date()?.toISOString(),
      date: new Date()?.toLocaleDateString(),
    };

    if (onComplete) {
      onComplete(checkInData);
    }
  };

  const canProceed = () => {
    if (currentStepData?.type === "rating") {
      return responses?.[currentStepData?.id] !== null;
    }
    return true; // Text step is optional
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Mindful Check-In
          </h3>
          <div className="text-sm text-muted-foreground">
            {currentStep + 1} / {steps?.length}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex space-x-2 mb-6">
          {steps?.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full ${
                index <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-foreground mb-6 text-center">
          {currentStepData?.title}
        </h4>

        {currentStepData?.type === "rating" && (
          <div className="space-y-3">
            {currentStepData?.options?.map((option) => (
              <button
                key={option?.value}
                onClick={() =>
                  handleRatingSelect(currentStepData?.id, option?.value)
                }
                className={`w-full p-4 rounded-lg border-2 transition-gentle ${
                  responses?.[currentStepData?.id] === option?.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{option?.emoji}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-foreground">
                      {option?.label}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      responses?.[currentStepData?.id] === option?.value
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {responses?.[currentStepData?.id] === option?.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {currentStepData?.type === "text" && (
          <div>
            <Input
              type="text"
              placeholder={currentStepData?.placeholder}
              value={responses?.reflection}
              onChange={(e) => handleTextChange(e?.target?.value)}
              className="min-h-[100px]"
            />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          iconName="ChevronLeft"
          iconPosition="left"
        >
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          iconName={isLastStep ? "Check" : "ChevronRight"}
          iconPosition="right"
        >
          {isLastStep ? "Complete" : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default MindfulCheckIn;
