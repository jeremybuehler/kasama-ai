import React from "react";

const QuestionCard = ({ question, selectedAnswer, onAnswerSelect }) => {
  if (!question) return null;

  return (
    <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-semibold text-foreground mb-3 leading-relaxed">
          {question?.question}
        </h2>
        {question?.description && (
          <p className="text-muted-foreground text-sm lg:text-base">
            {question?.description}
          </p>
        )}
      </div>
      <div className="space-y-3">
        {question?.options?.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswerSelect(option?.value)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-gentle ${
              selectedAnswer === option?.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/50 hover:bg-muted"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm lg:text-base">
                  {option?.label}
                </div>
                {option?.description && (
                  <div className="text-xs lg:text-sm text-muted-foreground mt-1">
                    {option?.description}
                  </div>
                )}
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                  selectedAnswer === option?.value
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                }`}
              >
                {selectedAnswer === option?.value && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
