import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const AssessmentHistorySection = ({
  assessmentHistory,
  onRetakeAssessment,
}) => {
  const [expandedAssessment, setExpandedAssessment] = useState(null);

  const mockAssessments = [
    {
      id: 1,
      type: "Relationship Readiness",
      completedDate: "2025-01-15",
      score: 78,
      status: "completed",
      insights: [
        "Strong communication foundation",
        "Areas for emotional intelligence growth",
        "Good conflict resolution skills",
      ],
    },
    {
      id: 2,
      type: "Communication Style",
      completedDate: "2025-01-10",
      score: 85,
      status: "completed",
      insights: [
        "Excellent active listening skills",
        "Clear expression of needs",
        "Empathetic response patterns",
      ],
    },
    {
      id: 3,
      type: "Emotional Intelligence",
      completedDate: "2025-01-05",
      score: 72,
      status: "completed",
      insights: [
        "Good self-awareness",
        "Room for improvement in emotional regulation",
        "Strong empathy for others",
      ],
    },
  ];

  const assessments =
    assessmentHistory?.length > 0 ? assessmentHistory : mockAssessments;

  const getScoreColor = (score) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-error";
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-success/10";
    if (score >= 60) return "bg-warning/10";
    return "bg-error/10";
  };

  const toggleExpanded = (assessmentId) => {
    setExpandedAssessment(
      expandedAssessment === assessmentId ? null : assessmentId,
    );
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <Icon name="FileText" size={20} className="text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Assessment History
            </h3>
            <p className="text-sm text-muted-foreground">
              View your completed assessments
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          iconName="RefreshCw"
          iconPosition="left"
          onClick={onRetakeAssessment}
        >
          Retake
        </Button>
      </div>
      <div className="space-y-4">
        {assessments?.map((assessment) => (
          <div
            key={assessment?.id}
            className="border border-border rounded-lg overflow-hidden"
          >
            <div
              className="p-4 cursor-pointer hover:bg-muted/50 transition-gentle"
              onClick={() => toggleExpanded(assessment?.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${getScoreBgColor(assessment?.score)}`}
                  >
                    <span
                      className={`font-semibold ${getScoreColor(assessment?.score)}`}
                    >
                      {assessment?.score}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">
                      {assessment?.type}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Completed on{" "}
                      {new Date(assessment.completedDate)?.toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>
                <Icon
                  name={
                    expandedAssessment === assessment?.id
                      ? "ChevronUp"
                      : "ChevronDown"
                  }
                  size={20}
                  className="text-muted-foreground"
                />
              </div>
            </div>

            {expandedAssessment === assessment?.id && (
              <div className="px-4 pb-4 border-t border-border bg-muted/20">
                <div className="pt-4">
                  <h5 className="font-medium text-foreground mb-3">
                    Key Insights:
                  </h5>
                  <ul className="space-y-2">
                    {assessment?.insights?.map((insight, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Icon
                          name="CheckCircle2"
                          size={16}
                          className="text-success mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-muted-foreground">
                          {insight}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Eye"
                      iconPosition="left"
                      onClick={() => {
                        // Handle view detailed results
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Download"
                      iconPosition="left"
                      onClick={() => {
                        // Handle download results
                      }}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {assessments?.length === 0 && (
        <div className="text-center py-8">
          <Icon
            name="FileText"
            size={48}
            className="text-muted-foreground mx-auto mb-4"
          />
          <h4 className="font-medium text-foreground mb-2">
            No Assessments Yet
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Complete your first assessment to start your relationship journey
          </p>
          <Button
            variant="default"
            iconName="Play"
            iconPosition="left"
            onClick={onRetakeAssessment}
          >
            Start Assessment
          </Button>
        </div>
      )}
    </div>
  );
};

export default AssessmentHistorySection;
