import React, { useState, useEffect } from "react";
import Icon from "@/components/AppIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const ActivityModal = ({ activity, isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e?.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      onClose();
    }
  };

  const startTimer = () => {
    setTimer(activity?.duration * 60); // Convert minutes to seconds
    setIsTimerRunning(true);
  };

  const handleStepResponse = (stepId, response) => {
    setResponses((prev) => ({
      ...prev,
      [stepId]: response,
    }));
  };

  const handleNext = () => {
    if (currentStep < activity?.steps?.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    const completionData = {
      activityId: activity?.id,
      responses,
      completedAt: new Date()?.toISOString(),
      duration: activity?.duration,
    };

    if (onComplete) {
      onComplete(completionData);
    }
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs?.toString()?.padStart(2, "0")}`;
  };

  if (!isOpen || !activity) return null;

  const currentStepData = activity?.steps?.[currentStep];
  const isLastStep = currentStep === activity?.steps?.length - 1;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center"
      onClick={handleBackdropClick}
    >
      <div className="lg:hidden w-full bg-card rounded-t-xl animate-slide-in max-h-[90vh] overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {activity?.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {activity?.steps?.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Timer Section */}
        {activity?.hasTimer && (
          <div className="p-4 bg-muted border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon
                  name="Clock"
                  size={16}
                  className="text-muted-foreground"
                />
                <span className="text-sm text-muted-foreground">
                  Practice Timer
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-mono text-lg font-semibold text-foreground">
                  {formatTime(timer)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startTimer}
                  disabled={isTimerRunning}
                  iconName="Play"
                  iconSize={16}
                >
                  {isTimerRunning ? "Running" : "Start"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {currentStepData?.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {currentStepData?.content}
            </p>
          </div>

          {currentStepData?.type === "reflection" && (
            <div className="mb-6">
              <Input
                type="text"
                label="Your reflection"
                placeholder="Share your thoughts..."
                value={responses?.[currentStepData?.id] || ""}
                onChange={(e) =>
                  handleStepResponse(currentStepData?.id, e?.target?.value)
                }
                className="min-h-[100px]"
              />
            </div>
          )}

          {currentStepData?.type === "checklist" && (
            <div className="space-y-3 mb-6">
              {currentStepData?.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-muted rounded-lg"
                >
                  <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
                    <Icon name="Check" size={12} className="text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-border">
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

            <div className="flex space-x-2">
              {activity?.steps?.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              iconName={isLastStep ? "Check" : "ChevronRight"}
              iconPosition="right"
            >
              {isLastStep ? "Complete" : "Next"}
            </Button>
          </div>
        </div>
      </div>
      {/* Desktop Modal */}
      <div className="hidden lg:block w-full max-w-2xl bg-card rounded-xl shadow-large animate-fade-in max-h-[80vh] overflow-hidden">
        {/* Desktop Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {activity?.title}
            </h2>
            <p className="text-muted-foreground">
              Step {currentStep + 1} of {activity?.steps?.length} •{" "}
              {activity?.duration} min
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Timer Section */}
        {activity?.hasTimer && (
          <div className="p-4 bg-muted border-b border-border">
            <div className="flex items-center justify-center space-x-4">
              <Icon name="Clock" size={20} className="text-muted-foreground" />
              <span className="font-mono text-2xl font-semibold text-foreground">
                {formatTime(timer)}
              </span>
              <Button
                variant="outline"
                onClick={startTimer}
                disabled={isTimerRunning}
                iconName="Play"
                iconPosition="left"
              >
                {isTimerRunning ? "Running" : "Start Timer"}
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              {currentStepData?.title}
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {currentStepData?.content}
            </p>
          </div>

          {currentStepData?.type === "reflection" && (
            <div className="mb-6">
              <Input
                type="text"
                label="Your reflection"
                placeholder="Share your thoughts and insights..."
                value={responses?.[currentStepData?.id] || ""}
                onChange={(e) =>
                  handleStepResponse(currentStepData?.id, e?.target?.value)
                }
                className="min-h-[120px]"
              />
            </div>
          )}

          {currentStepData?.type === "checklist" && (
            <div className="grid gap-3 mb-6">
              {currentStepData?.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-muted rounded-lg"
                >
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
                    <Icon name="Check" size={14} className="text-primary" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-border">
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

            <div className="flex space-x-2">
              {activity?.steps?.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              iconName={isLastStep ? "Check" : "ChevronRight"}
              iconPosition="right"
            >
              {isLastStep ? "Complete" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;
