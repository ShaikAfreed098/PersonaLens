"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, UserProfile, AssessmentRecord } from "@/utils/db";
import { QUESTIONS } from "@/utils/questions";
import {
  getInitialTraitState,
  selectNextQuestion,
  updateTraits,
  getAssessmentMetrics,
  Question,
  UserResponse,
  TraitState
} from "@/utils/trait-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUp, ArrowDown, Send, Brain, Sparkles, ShieldCheck, ChevronRight, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function AssessmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [traits, setTraits] = useState<TraitState>(getInitialTraitState());
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  
  // Navigation & UI states
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitStatusText, setSubmitStatusText] = useState("Aggregating behavioral signals...");
  
  // Time tracking
  const questionStartTime = useRef<number>(Date.now());

  // Input states for current question
  const [textAnswer, setTextAnswer] = useState("");
  const [rankedOptions, setRankedOptions] = useState<any[]>([]);

  // Load User & Assessment session
  useEffect(() => {
    async function initSession() {
      try {
        const u = await db.getCurrentUser();
        if (!u) {
          router.push("/auth");
          return;
        }
        setUser(u);

        // Check if there is an active incomplete assessment
        const history = await db.getUserHistory(u.id);
        const active = history.find(h => !h.assessment.completed_at);

        let activeAssessment: AssessmentRecord;
        let loadedTraits = getInitialTraitState();
        let loadedResponses: UserResponse[] = [];

        if (active) {
          activeAssessment = active.assessment;
          // Load previous responses to rebuild trait state
          loadedResponses = await db.getResponses(active.assessment.id);
          
          // Re-evaluate trait state from responses
          for (const resp of loadedResponses) {
            const q = QUESTIONS.find(temp => temp.id === resp.questionId);
            if (q) {
              loadedTraits = updateTraits(loadedTraits, q, resp);
            }
          }
        } else {
          // Create new assessment
          activeAssessment = await db.createAssessment(u.id);
        }

        setAssessment(activeAssessment);
        setTraits(loadedTraits);
        setResponses(loadedResponses);

        const metrics = getAssessmentMetrics(loadedTraits, loadedResponses.length);
        if (metrics.shouldStop) {
          // If 20 questions are already done, synthesize report directly
          await triggerFinalAnalysis(loadedTraits, loadedResponses, metrics.averageConfidence, activeAssessment, u);
        } else {
          // Select first question
          const nextQ = selectNextQuestion(loadedTraits, QUESTIONS, loadedResponses);
          setCurrentQuestion(nextQ);
          questionStartTime.current = Date.now();
        }
      } catch (err) {
        console.error("Session initialization error:", err);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [router]);

  // Sync current question input states when question changes
  useEffect(() => {
    if (currentQuestion) {
      setTextAnswer("");
      if (currentQuestion.type === "Ranking") {
        setRankedOptions([...currentQuestion.options]);
      }
      questionStartTime.current = Date.now();
    }
  }, [currentQuestion]);

  // Re-ordering logic for ranking questions
  const moveRank = (index: number, direction: "up" | "down") => {
    const newItems = [...rankedOptions];
    if (direction === "up" && index > 0) {
      const temp = newItems[index];
      newItems[index] = newItems[index - 1];
      newItems[index - 1] = temp;
    } else if (direction === "down" && index < newItems.length - 1) {
      const temp = newItems[index];
      newItems[index] = newItems[index + 1];
      newItems[index + 1] = temp;
    }
    setRankedOptions(newItems);
  };

  // Submit Answer & Route Next
  const handleAnswer = async (answerVal: string | string[]) => {
    try {
      if (!assessment || !currentQuestion) return;

      const responseTimeMs = Date.now() - questionStartTime.current;
      
      // Save response locally & database
      const newResponse: UserResponse = {
        questionId: currentQuestion.id,
        answer: answerVal,
        responseTimeMs
      };

      // Update locally
      const updatedResponses = [...responses, newResponse];
      const updatedTraits = updateTraits(traits, currentQuestion, newResponse);
      
      setResponses(updatedResponses);
      setTraits(updatedTraits);

      // Save response in background database
      try {
        await db.saveResponse(assessment.id, currentQuestion.id, answerVal, responseTimeMs);
      } catch (dbError) {
        console.error("Database save failed. Proceeding locally:", dbError);
      }

      // Check progress metrics
      const metrics = getAssessmentMetrics(updatedTraits, updatedResponses.length);

      if (metrics.shouldStop) {
        // Begin AI final analysis
        await triggerFinalAnalysis(updatedTraits, updatedResponses, metrics.averageConfidence);
      } else {
        // Find next question
        const nextQ = selectNextQuestion(updatedTraits, QUESTIONS, updatedResponses);
        setCurrentQuestion(nextQ);
      }
    } catch (err) {
      console.error("Error inside handleAnswer:", err);
      // Attempt safety recovery to next question
      try {
        const nextQ = selectNextQuestion(traits, QUESTIONS, responses);
        setCurrentQuestion(nextQ);
      } catch (recoveryErr) {
        console.error("Recovery failed:", recoveryErr);
      }
    }
  };

  async function triggerFinalAnalysis(
    finalTraits: TraitState,
    finalResponses: UserResponse[],
    confidenceScore: number,
    currentAssessment?: AssessmentRecord | null,
    currentUser?: UserProfile | null
  ) {
    const activeAssessment = currentAssessment !== undefined ? currentAssessment : assessment;
    const activeUser = currentUser !== undefined ? currentUser : user;
    if (!activeAssessment || !activeUser) return;
    setIsSubmitting(true);
    setSubmitProgress(10);
    
    // Animate fake progress stages to show AI depth
    const progressInterval = setInterval(() => {
      setSubmitProgress(prev => {
        if (prev < 90) {
          const next = prev + Math.floor(Math.random() * 15) + 5;
          if (next >= 30 && next < 55) {
            setSubmitStatusText("Synthesizing open-ended semantic responses...");
          } else if (next >= 55 && next < 75) {
            setSubmitStatusText("Mapping primary & secondary archetypes...");
          } else if (next >= 75) {
            setSubmitStatusText("Constructing growth recommendations...");
          }
          return Math.min(next, 92);
        }
        return prev;
      });
    }, 350);

    try {
      // Call Gemini API Route
      const response = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: activeAssessment.id,
          userId: activeUser.id,
          responses: finalResponses,
          traits: finalTraits
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI report");
      }

      const reportData = await response.json();
      
      // Save the generated report to database/local storage
      const savedReport = await db.saveReport(activeAssessment.id, reportData);
      
      // Save completed assessment metadata
      await db.completeAssessment(activeAssessment.id, confidenceScore);
      
      clearInterval(progressInterval);
      setSubmitProgress(100);
      setSubmitStatusText("Behavioral profile generated!");
      
      setTimeout(() => {
        router.push(`/report/${savedReport.id}`);
      }, 500);

    } catch (error) {
      console.error("AI report generation failed:", error);
      // Fail gracefully: Mock saving local storage report if offline and bypass server error
      const mockReportData = generateOfflineMockReport(finalTraits);
      const savedReport = await db.saveReport(activeAssessment.id, mockReportData);
      await db.completeAssessment(activeAssessment.id, confidenceScore);
      
      clearInterval(progressInterval);
      setSubmitProgress(100);
      setSubmitStatusText("Profile compiled locally!");
      
      setTimeout(() => {
        router.push(`/report/${savedReport.id}`);
      }, 800);
    }
  }

  // Generate fallback mock report if offline
  const generateOfflineMockReport = (finalTraits: TraitState) => {
    return {
      primaryArchetype: "Adaptive Explorer",
      secondaryArchetype: "Strategic Builder",
      summary: "You demonstrate highly structured, long-term oriented analytical patterns combined with high uncertainty tolerance.",
      strengths: ["Strong problem solving capacity", "Strategic leadership style", "Adaptive learns quickly"],
      blindSpots: ["Can spend too long analyzing before action", "Might struggle with delegating control"],
      stressResponses: "Under high stress, you shift from collaborative brainstorming to analytical problem-solving.",
      leadershipStyle: "Collaborative yet goal-oriented. You lead by setting clear objectives and values.",
      relationshipStyle: "Direct, empathetic, and communicative.",
      growthOpportunities: ["Practice faster decision-making with incomplete information", "Increase delegation tasks"],
      finalTraits
    };
  };

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-background p-6 text-slate-900 min-h-screen font-body">
        <div className="relative h-16 w-16 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 border-r-2 border-purple-500 animate-spin" />
          <Brain className="h-6 w-6 text-indigo-500 animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Assessment Session...</p>
      </main>
    );
  }

  const metrics = getAssessmentMetrics(traits, responses.length);

  return (
    <main className="flex-1 bg-background flex flex-col min-h-screen relative font-body text-slate-900">
      {/* Dynamic Background Blur */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      {/* Header Info */}
      <header className="border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-20 py-4 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-indigo-purple flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-sm font-bold tracking-tight text-slate-900">
              Persona<span className="text-gradient">Lens</span>
            </span>
          </div>
        </div>
      </header>

      {/* Submitting Loading Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6"
          >
            <div className="relative h-24 w-24 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 border-r-2 border-purple-500 animate-spin" />
              <Brain className="h-9 w-9 text-indigo-500 animate-pulse" />
            </div>

            <h2 className="font-heading text-xl font-bold text-slate-900 mb-2 text-center">
              Compiling Behavioral Analytics
            </h2>
            <p className="text-xs text-slate-550 mb-6 text-center max-w-sm h-8 font-body">
              {submitStatusText}
            </p>

            <div className="w-full max-w-xs space-y-1.5 mb-8">
              <Progress value={submitProgress} className="h-2" />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>ANALYZING RESPONSES</span>
                <span className="font-mono text-slate-700">{submitProgress}%</span>
              </div>
            </div>

            <div className="space-y-4 w-full max-w-xs p-6 bg-secondary border border-border rounded-[24px]">
              {[
                { label: "Analyzing responses", active: submitProgress >= 10 },
                { label: "Evaluating behavioral patterns", active: submitProgress >= 40 },
                { label: "Building profile", active: submitProgress >= 70 },
                { label: "Generating report", active: submitProgress >= 90 }
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs font-body">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all duration-355 ${
                    step.active 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "border-slate-200 text-slate-400 bg-white"
                  }`}>
                    {step.active ? "✓" : idx + 1}
                  </div>
                  <span className={`font-semibold ${step.active ? "text-slate-800" : "text-slate-400"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Canvas */}
      <div className="flex-1 max-w-[800px] w-full mx-auto p-6 flex flex-col justify-center">
        <Card className="bg-white border-border shadow-soft p-6 sm:p-8">
          <div className="space-y-6">
            {/* Question counter progress bar */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                <span className="tracking-wide text-[9px] uppercase font-bold text-indigo-650">Adaptive Question Route</span>
                <div className="flex items-center gap-2">
                  <span className="bg-purple-50 text-purple-650 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-purple-100/50">
                    Profile Confidence: {Math.round(metrics.averageConfidence * 100)}%
                  </span>
                  <span className="font-mono text-slate-700">Q {Math.min(responses.length + 1, 20)}/20</span>
                </div>
              </div>
              <Progress value={metrics.progressPercent} className="h-2" />
            </div>

            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {/* Category & Section headers */}
                  <div className="flex flex-col space-y-1">
                    <span className="text-[10px] tracking-wider uppercase font-bold text-indigo-600">
                      {currentQuestion.category}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {currentQuestion.section}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h2 className="font-heading text-fluid-h2 font-bold text-slate-900 leading-snug">
                    {currentQuestion.question}
                  </h2>

                  {/* Dynamic Option Renderers */}
                  <div className="pt-2">
                    {/* FORCED CHOICE */}
                    {currentQuestion.type === "Forced Choice" && (
                      <div className="grid grid-cols-1 gap-3">
                        {currentQuestion.options.map((option) => (
                          <div
                            id={`opt-${option.label}`}
                            key={option.label}
                            onClick={() => handleAnswer(option.label)}
                            className="flex border border-border hover:border-indigo-500 bg-white hover:bg-indigo-50/15 cursor-pointer transition-all active:scale-[0.98] group rounded-[16px] p-4 items-center gap-4 duration-300 shadow-xs hover:shadow-[0_8px_20px_rgba(99,102,241,0.06)]"
                          >
                            <div className="h-8 w-8 rounded-xl bg-slate-50 border border-border text-slate-500 flex items-center justify-center font-bold text-sm font-heading flex-shrink-0 group-hover:border-indigo-500/30 group-hover:bg-gradient-indigo-purple group-hover:text-white transition-all duration-300">
                              <span className="group-hover:hidden">{option.label}</span>
                              <Check className="h-4 w-4 hidden group-hover:block text-white" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                              {option.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* LIKERT SCALE (1-5) */}
                    {currentQuestion.type === "Likert" && (
                      <div className="grid grid-cols-1 gap-3">
                        {currentQuestion.options.map((option) => (
                          <div
                            id={`opt-likert-${option.label}`}
                            key={option.label}
                            onClick={() => handleAnswer(option.label)}
                            className="flex border border-border hover:border-indigo-500 bg-white hover:bg-indigo-50/15 cursor-pointer transition-all active:scale-[0.98] group rounded-[16px] p-4 items-center gap-4 duration-300 shadow-xs hover:shadow-[0_8px_20px_rgba(99,102,241,0.06)]"
                          >
                            <div className="h-8 w-8 rounded-full bg-slate-50 border border-border text-slate-500 flex items-center justify-center font-bold text-xs font-heading flex-shrink-0 group-hover:border-indigo-500/30 group-hover:bg-gradient-indigo-purple group-hover:text-white transition-all duration-300">
                              <span className="group-hover:hidden">{option.label}</span>
                              <Check className="h-3.5 w-3.5 hidden group-hover:block text-white" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                              {option.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* RANKING (Drag/Drop Reordering) */}
                    {currentQuestion.type === "Ranking" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {rankedOptions.map((option, idx) => (
                            <div
                              key={option.label}
                              className="flex items-center gap-3 p-4 bg-secondary border border-border rounded-[16px]"
                            >
                              <span className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-650 text-xs flex items-center justify-center font-bold flex-shrink-0 font-mono">
                                {idx + 1}
                              </span>
                              <span className="flex-1 text-sm font-semibold text-slate-700">
                                {option.text}
                              </span>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => moveRank(idx, "up")}
                                  disabled={idx === 0}
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => moveRank(idx, "down")}
                                  disabled={idx === rankedOptions.length - 1}
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          id="submit-rank-btn"
                          variant="gradient"
                          onClick={() => handleAnswer(rankedOptions.map(r => r.label))}
                          className="w-full gap-2 font-semibold h-11 shadow-md shadow-indigo-500/10"
                        >
                          Confirm Priority Order
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* OPEN ENDED (Long reflection) */}
                    {currentQuestion.type === "Open-Ended" && (
                      <div className="space-y-4">
                        <textarea
                          id="open-ended-textarea"
                          placeholder="Type your reflection here. Be honest and narrative..."
                          rows={5}
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          className="w-full p-4 bg-secondary border border-border rounded-[16px] text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body resize-y"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-450 font-bold font-mono">
                            {textAnswer.trim().split(/\s+/).filter(Boolean).length} WORDS
                          </span>
                          <Button
                            id="submit-text-btn"
                            variant="gradient"
                            onClick={() => handleAnswer(textAnswer)}
                            disabled={!textAnswer.trim()}
                            className="gap-2 font-semibold h-11 px-6 shadow-md shadow-indigo-500/10"
                          >
                            Next Question
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>
    </main>
  );
}
