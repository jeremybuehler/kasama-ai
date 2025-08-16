import React, { useState, useEffect } from "react";
import Icon from "../AppIcon";
import Button from "./Button";
import ProgressBar from "./ProgressBar";

const AssessmentFlow = ({
  questions = [],
  onComplete,
  onExit,
  initialAnswers = {},
  showProgress = true,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions?.[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions?.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions?.length) * 100;

  useEffect(() => {
    // Prevent body scroll when assessment is active
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleAnswer = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (onComplete) {
        await onComplete(answers);
      }
    } catch (error) {
      console.error("Assessment submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentQuestionAnswered = () => {
    return currentQuestion && answers?.[currentQuestion?.id] !== undefined;
  };

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <Icon
            name="AlertCircle"
            size={48}
            className="text-muted-foreground mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Questions Available
          </h2>
          <p className="text-muted-foreground mb-6">
            There are no assessment questions to display.
          </p>
          <Button onClick={onExit}>Exit Assessment</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onExit}
              iconName="X"
              iconSize={20}
            />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Assessment
              </h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions?.length}
              </p>
            </div>
          </div>

          {showProgress && (
            <div className="hidden sm:block w-32">
              <ProgressBar
                value={progress}
                showPercentage={false}
                size="sm"
                animated={true}
              />
            </div>
          )}
        </div>

        {showProgress && (
          <div className="sm:hidden mt-4">
            <ProgressBar
              value={progress}
              showPercentage={true}
              size="sm"
              animated={true}
            />
          </div>
        )}
      </header>
      {/* Question Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 leading-relaxed">
              {currentQuestion?.question}
            </h2>
            {currentQuestion?.description && (
              <p className="text-muted-foreground">
                {currentQuestion?.description}
              </p>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion?.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(currentQuestion?.id, option?.value)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-gentle ${
                  answers?.[currentQuestion?.id] === option?.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{option?.label}</div>
                    {option?.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {option?.description}
                      </div>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      answers?.[currentQuestion?.id] === option?.value
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {answers?.[currentQuestion?.id] === option?.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
      {/* Navigation Footer */}
      <footer className="bg-card border-t border-border px-4 py-4 lg:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            iconName="ChevronLeft"
            iconPosition="left"
          >
            Previous
          </Button>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{currentQuestionIndex + 1}</span>
            <span>/</span>
            <span>{questions?.length}</span>
          </div>

          <Button
            onClick={handleNext}
            disabled={!isCurrentQuestionAnswered() || isSubmitting}
            loading={isSubmitting}
            iconName={isLastQuestion ? "Check" : "ChevronRight"}
            iconPosition="right"
          >
            {isLastQuestion ? "Complete" : "Next"}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default AssessmentFlow;
