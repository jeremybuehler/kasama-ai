import React from "react";
import Button from "@/components/ui/Button";

const NavigationControls = ({
  currentQuestion,
  totalQuestions,
  isAnswered,
  onPrevious,
  onNext,
  isSubmitting,
}) => {
  const isFirstQuestion = currentQuestion === 1;
  const isLastQuestion = currentQuestion === totalQuestions;

  return (
    <footer className="bg-card border-t border-border px-4 py-4 lg:px-6 sticky bottom-0 z-40">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstQuestion}
          iconName="ChevronLeft"
          iconPosition="left"
          className="min-w-[100px]"
        >
          Previous
        </Button>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          <span className="font-medium">{currentQuestion}</span>
          <span>/</span>
          <span>{totalQuestions}</span>
        </div>

        <Button
          onClick={onNext}
          disabled={!isAnswered || isSubmitting}
          loading={isSubmitting}
          iconName={isLastQuestion ? "Check" : "ChevronRight"}
          iconPosition="right"
          className="min-w-[100px]"
        >
          {isLastQuestion ? "Complete" : "Next"}
        </Button>
      </div>
    </footer>
  );
};

export default NavigationControls;
