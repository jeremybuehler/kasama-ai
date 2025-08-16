import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AssessmentHeader from "./components/AssessmentHeader";
import QuestionCard from "./components/QuestionCard";
import NavigationControls from "./components/NavigationControls";
import CompletionModal from "./components/CompletionModal";
import assessmentScoringService from "../../services/assessment-scoring";
import progressTrackingService from "../../services/progress-tracking";
import aiInsightsService from "../../services/ai-insights";

const RelationshipAssessment = () => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);

  // Mock assessment questions data
  const assessmentQuestions = [
    {
      id: "communication_style",
      question:
        "How do you typically handle disagreements in your relationships?",
      description:
        "Think about your most recent relationship conflicts and your natural response patterns.",
      options: [
        {
          label: "I prefer to discuss issues openly and immediately",
          value: "direct_communication",
          description: "You address conflicts head-on with honest dialogue",
        },
        {
          label: "I need time to process before discussing difficult topics",
          value: "reflective_communication",
          description: "You prefer to think things through before engaging",
        },
        {
          label: "I try to avoid conflict and hope issues resolve naturally",
          value: "avoidant_communication",
          description:
            "You tend to minimize or postpone difficult conversations",
        },
        {
          label: "I get emotional and sometimes say things I regret",
          value: "reactive_communication",
          description: "Your emotions often drive your initial responses",
        },
      ],
    },
    {
      id: "emotional_availability",
      question:
        "When your partner is going through a difficult time, how do you typically respond?",
      description:
        "Consider your natural instincts when someone you care about is struggling emotionally.",
      options: [
        {
          label: "I immediately offer practical solutions and advice",
          value: "solution_focused",
          description: "You focus on fixing the problem quickly",
        },
        {
          label: "I listen actively and provide emotional support",
          value: "emotionally_supportive",
          description: "You prioritize being present and understanding",
        },
        {
          label: "I feel overwhelmed and sometimes withdraw",
          value: "overwhelmed_response",
          description: "Others\' emotions can feel too intense for you",
        },
        {
          label: "I try to cheer them up or distract them from the problem",
          value: "distraction_focused",
          description: "You prefer to shift focus to positive things",
        },
      ],
    },
    {
      id: "attachment_patterns",
      question: "How do you feel when your partner needs space or time alone?",
      description:
        "Reflect on your emotional reactions when your partner seeks independence or solitude.",
      options: [
        {
          label: "I respect their need and use the time for my own interests",
          value: "secure_independence",
          description: "You\'re comfortable with healthy independence",
        },
        {
          label: "I worry they\'re pulling away or losing interest in me",
          value: "anxious_attachment",
          description: "Space can trigger fears of abandonment",
        },
        {
          label: "I feel relieved and prefer having my own space too",
          value: "avoidant_attachment",
          description: "You value independence and self-reliance",
        },
        {
          label: "I feel confused about whether to give space or stay close",
          value: "disorganized_attachment",
          description: "You\'re uncertain about the right response",
        },
      ],
    },
    {
      id: "intimacy_comfort",
      question:
        "How comfortable are you with sharing your deepest fears and vulnerabilities?",
      description:
        "Think about your willingness to be emotionally open and transparent in relationships.",
      options: [
        {
          label:
            "Very comfortable - I believe vulnerability strengthens relationships",
          value: "high_vulnerability",
          description: "You see openness as essential for deep connection",
        },
        {
          label: "Somewhat comfortable - I share gradually as trust builds",
          value: "moderate_vulnerability",
          description: "You open up slowly as relationships develop",
        },
        {
          label:
            "Uncomfortable - I prefer to handle personal struggles privately",
          value: "low_vulnerability",
          description: "You tend to keep deeper emotions to yourself",
        },
        {
          label: "It depends entirely on the person and situation",
          value: "situational_vulnerability",
          description: "Your openness varies greatly by context",
        },
      ],
    },
    {
      id: "relationship_priorities",
      question: "What matters most to you in a romantic relationship?",
      description:
        "Consider what you value most highly when thinking about your ideal partnership.",
      options: [
        {
          label: "Deep emotional connection and understanding",
          value: "emotional_connection",
          description: "You prioritize feeling truly known and accepted",
        },
        {
          label: "Shared goals, values, and life direction",
          value: "shared_vision",
          description: "You value alignment on important life matters",
        },
        {
          label: "Fun, adventure, and enjoying life together",
          value: "companionship_joy",
          description: "You prioritize happiness and shared experiences",
        },
        {
          label: "Stability, security, and reliable partnership",
          value: "security_stability",
          description: "You value consistency and dependability",
        },
      ],
    },
    {
      id: "conflict_resolution",
      question:
        "After an argument with your partner, what's your typical pattern?",
      description:
        "Think about how you usually behave in the hours and days following a disagreement.",
      options: [
        {
          label: "I initiate a conversation to resolve things quickly",
          value: "proactive_resolution",
          description: "You prefer to address and resolve conflicts promptly",
        },
        {
          label: "I wait for them to make the first move toward reconciliation",
          value: "passive_resolution",
          description: "You tend to wait for your partner to initiate repair",
        },
        {
          label: "I need significant time before I'm ready to reconnect",
          value: "delayed_resolution",
          description: "You require processing time before re-engaging",
        },
        {
          label: "I act like nothing happened and hope it blows over",
          value: "avoidant_resolution",
          description: "You prefer to move past conflicts without discussion",
        },
      ],
    },
    {
      id: "personal_growth",
      question:
        "How do you typically respond to feedback about your behavior in relationships?",
      description:
        "Consider your reactions when partners point out patterns or suggest changes.",
      options: [
        {
          label: "I appreciate the feedback and work on making changes",
          value: "growth_oriented",
          description: "You see feedback as an opportunity for improvement",
        },
        {
          label: "I listen but often feel defensive initially",
          value: "defensive_but_receptive",
          description:
            "You need time to process feedback without feeling attacked",
        },
        {
          label: "I feel criticized and struggle to hear the message",
          value: "defensive_resistant",
          description: "Feedback often feels like personal attacks",
        },
        {
          label: "I agree in the moment but find it hard to actually change",
          value: "agreeable_but_stuck",
          description: "You want to change but struggle with follow-through",
        },
      ],
    },
    {
      id: "emotional_regulation",
      question:
        "When you're feeling overwhelmed or stressed, how does it affect your relationships?",
      description:
        "Think about how your stress levels impact your interactions with romantic partners.",
      options: [
        {
          label: "I communicate my stress and ask for support when needed",
          value: "healthy_communication",
          description:
            "You\'re able to express needs and seek appropriate help",
        },
        {
          label: "I become more irritable and less patient with my partner",
          value: "stress_reactive",
          description: "Stress makes you more likely to snap or withdraw",
        },
        {
          label: "I withdraw and handle stress independently",
          value: "stress_isolating",
          description: "You prefer to manage difficult emotions alone",
        },
        {
          label: "I become more clingy and need extra reassurance",
          value: "stress_seeking",
          description: "Stress increases your need for connection and comfort",
        },
      ],
    },
    {
      id: "trust_building",
      question:
        "How do you typically build trust in a new romantic relationship?",
      description:
        "Consider your approach to developing confidence and security with a new partner.",
      options: [
        {
          label: "Through consistent actions and open communication over time",
          value: "gradual_trust_building",
          description:
            "You believe trust develops naturally through reliability",
        },
        {
          label:
            "By sharing personal information and expecting the same in return",
          value: "reciprocal_trust_building",
          description: "You build trust through mutual vulnerability",
        },
        {
          label: "I tend to trust quickly until given a reason not to",
          value: "high_initial_trust",
          description: "You start with trust and adjust based on experience",
        },
        {
          label:
            "I'm cautious and need significant proof before trusting deeply",
          value: "cautious_trust_building",
          description: "You require substantial evidence before fully trusting",
        },
      ],
    },
    {
      id: "relationship_expectations",
      question:
        "What\'s your biggest concern about entering a serious relationship?",
      description:
        "Reflect on what worries you most when considering long-term romantic commitment.",
      options: [
        {
          label: "Losing my independence and personal identity",
          value: "independence_concern",
          description: "You worry about maintaining your sense of self",
        },
        {
          label: "Not being able to meet my partner\'s needs consistently",
          value: "adequacy_concern",
          description: "You fear not being good enough for your partner",
        },
        {
          label: "Getting hurt or abandoned when I become vulnerable",
          value: "vulnerability_concern",
          description: "You worry about the risks of emotional openness",
        },
        {
          label: "Settling for someone who isn\'t truly right for me",
          value: "compatibility_concern",
          description: "You fear making the wrong choice in a partner",
        },
      ],
    },
    {
      id: "love_languages",
      question: "How do you most naturally express love and affection?",
      description:
        "Think about your instinctive ways of showing care and love to romantic partners.",
      options: [
        {
          label: "Through physical touch, hugs, and intimate moments",
          value: "physical_touch",
          description: "You express love through physical connection",
        },
        {
          label: "By spending quality time and giving undivided attention",
          value: "quality_time",
          description: "You show love through presence and focused attention",
        },
        {
          label: "Through thoughtful gifts and meaningful gestures",
          value: "gifts_gestures",
          description: "You express care through tangible tokens of affection",
        },
        {
          label: "By doing helpful things and acts of service",
          value: "acts_of_service",
          description: "You show love through actions that make life easier",
        },
      ],
    },
    {
      id: "future_planning",
      question: "How do you approach planning for the future in relationships?",
      description:
        "Consider your comfort level with making long-term plans and commitments with a partner.",
      options: [
        {
          label: "I enjoy planning and discussing our shared future together",
          value: "collaborative_planning",
          description: "You find future planning exciting and bonding",
        },
        {
          label: "I prefer to take things one step at a time",
          value: "gradual_planning",
          description: "You like to let relationships develop naturally",
        },
        {
          label: "I find future planning stressful and overwhelming",
          value: "planning_anxiety",
          description: "Long-term planning creates pressure and worry",
        },
        {
          label: "I have my own plans and hope my partner fits into them",
          value: "individual_planning",
          description: "You prefer to maintain your own life direction",
        },
      ],
    },
    {
      id: "social_integration",
      question:
        "How important is it that your partner gets along well with your friends and family?",
      description:
        "Think about the role you want your social circles to play in your romantic relationship.",
      options: [
        {
          label: "Extremely important - they need to be part of my whole life",
          value: "high_integration",
          description:
            "You want your partner fully integrated into your social world",
        },
        {
          label: "Important, but I can manage some differences or tensions",
          value: "moderate_integration",
          description: "You value harmony but can handle some challenges",
        },
        {
          label: "Nice to have, but not essential for our relationship",
          value: "low_integration",
          description: "You can keep your relationship somewhat separate",
        },
        {
          label:
            "I prefer to keep my relationship and social life mostly separate",
          value: "compartmentalized",
          description: "You like maintaining distinct boundaries between areas",
        },
      ],
    },
    {
      id: "personal_boundaries",
      question:
        "How do you handle it when a partner crosses one of your boundaries?",
      description:
        "Consider your typical response when someone violates your personal limits or comfort zones.",
      options: [
        {
          label: "I address it directly and clearly restate my boundary",
          value: "assertive_boundaries",
          description: "You communicate boundaries clearly and consistently",
        },
        {
          label:
            "I feel uncomfortable but often don't say anything immediately",
          value: "passive_boundaries",
          description: "You struggle to speak up about boundary violations",
        },
        {
          label: "I get upset and may overreact to the boundary crossing",
          value: "reactive_boundaries",
          description: "Boundary violations trigger strong emotional responses",
        },
        {
          label:
            "I question whether my boundary was reasonable in the first place",
          value: "flexible_boundaries",
          description: "You tend to doubt your own limits and adjust them",
        },
      ],
    },
    {
      id: "relationship_readiness",
      question:
        "What best describes your current readiness for a committed relationship?",
      description:
        "Honestly assess where you are right now in terms of emotional availability and commitment capacity.",
      options: [
        {
          label:
            "I\'m emotionally ready and actively seeking a serious partnership",
          value: "fully_ready",
          description: "You feel prepared for deep commitment and partnership",
        },
        {
          label:
            "I\'m mostly ready but still working on some personal growth areas",
          value: "mostly_ready",
          description:
            "You\'re prepared but recognize areas for continued development",
        },
        {
          label: "I\'m interested but feel I need more time to work on myself",
          value: "developing_readiness",
          description:
            "You want a relationship but know you need more preparation",
        },
        {
          label:
            "I'm unsure if I'm ready for the demands of a serious relationship",
          value: "uncertain_readiness",
          description:
            "You have doubts about your current capacity for commitment",
        },
      ],
    },
  ];

  const currentQuestion = assessmentQuestions?.[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / assessmentQuestions?.length) * 100;
  const isAnswered = answers?.[currentQuestion?.id] !== undefined;

  useEffect(() => {
    // Prevent body scroll when assessment is active
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleAnswerSelect = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion?.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex === assessmentQuestions?.length - 1) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Calculate comprehensive assessment results
      const scoringResults =
        assessmentScoringService.calculateOverallScore(answers);

      const results = {
        ...scoringResults,
        totalAnswered: Object.keys(answers)?.length,
        completionRate: 100,
        assessmentType: "Relationship Readiness",
        completedAt: new Date()?.toISOString(),
        answers: answers,
        shareableResults:
          assessmentScoringService.generateShareableResults(scoringResults),
      };

      // Record assessment completion in progress tracking
      const progressUpdate =
        progressTrackingService.recordAssessmentCompletion(results);

      // Generate AI insights based on results
      const userProfile = { assessmentResults: results };
      const personalizedInsights =
        await aiInsightsService.generatePersonalizedInsights(
          userProfile,
          results,
          progressUpdate.progressData.activityHistory.slice(0, 10),
        );

      results.insights = personalizedInsights;
      results.newAchievements = progressUpdate.newAchievements;

      // Store comprehensive results
      localStorage.setItem("assessmentResults", JSON.stringify(results));
      localStorage.setItem("assessmentCompleted", "true");
      localStorage.setItem("assessmentCompletedAt", new Date()?.toISOString());
      localStorage.setItem("latestAssessmentScore", results.score.toString());

      setAssessmentResults(results);
      setShowCompletionModal(true);
    } catch (error) {
      console.error("Assessment submission error:", error);

      // Fallback to basic results if services fail
      const basicResults = {
        totalAnswered: Object.keys(answers)?.length,
        completionRate: 100,
        assessmentType: "Relationship Readiness",
        completedAt: new Date()?.toISOString(),
        answers: answers,
        score: 75, // Default score
        insights: [],
      };

      setAssessmentResults(basicResults);
      setShowCompletionModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
    const confirmExit = window.confirm(
      "Are you sure you want to exit the assessment? Your progress will be lost.",
    );
    if (confirmExit) {
      navigate("/welcome-onboarding");
    }
  };

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Loading Assessment...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we prepare your questions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AssessmentHeader
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={assessmentQuestions?.length}
        progress={progress}
        onExit={handleExit}
      />
      <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={answers?.[currentQuestion?.id]}
            onAnswerSelect={handleAnswerSelect}
          />
        </div>
      </main>
      <NavigationControls
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={assessmentQuestions?.length}
        isAnswered={isAnswered}
        onPrevious={handlePrevious}
        onNext={handleNext}
        isSubmitting={isSubmitting}
      />
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={handleCloseCompletionModal}
        assessmentResults={assessmentResults}
      />
    </div>
  );
};

export default RelationshipAssessment;
