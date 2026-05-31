"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, UserProfile, AssessmentRecord, ReportRecord } from "@/utils/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChartView } from "@/components/radar-chart-view";
import {
  Brain,
  Play,
  FileText,
  Calendar,
  LogOut,
  User,
  ShieldCheck,
  TrendingUp,
  Clock,
  ExternalLink,
  Plus,
  ChevronDown
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<Array<{ assessment: AssessmentRecord; report: ReportRecord | null }>>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const u = await db.getCurrentUser();
      if (!u) {
        router.push("/auth");
        return;
      }
      setUser(u);

      const records = await db.getUserHistory(u.id);
      setHistory(records);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await db.logout();
    router.push("/");
  };

  const startNewAssessment = async () => {
    if (!user) return;
    // We navigate to /assessment, which will automatically spin up a new assessment if no incomplete one exists,
    // or resume if one does. To force a new one, we can clean up any incomplete assessment in DB or let assessment page handle it.
    // Let's check if there is an incomplete assessment.
    const active = history.find(h => !h.assessment.completed_at);
    if (active) {
      // If there is an active one, let's route to /assessment to continue it
      router.push("/assessment");
    } else {
      // Create new assessment
      setLoading(true);
      await db.createAssessment(user.id);
      router.push("/assessment");
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-background p-6 text-slate-900 min-h-screen font-body">
        <div className="relative h-16 w-16 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 border-r-2 border-purple-500 animate-spin" />
          <Brain className="h-6 w-6 text-indigo-500 animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Dashboard...</p>
      </main>
    );
  }

  // Segment assessments into completed and incomplete
  const completed = history.filter(h => h.assessment.completed_at && h.report);
  const activeIncomplete = history.find(h => !h.assessment.completed_at);
  const latestReport = completed.length > 0 ? completed[0].report : null;

  return (
    <main className="flex-1 bg-background min-h-screen relative font-body text-slate-900">
      {/* Decorative Orbs */}
      <div className="absolute top-[-50px] right-[-50px] h-[300px] w-[300px] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-50px] left-[-50px] h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[80px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-md py-4 px-6 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-indigo-purple flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-sm font-bold tracking-tight text-slate-900">
              Persona<span className="text-gradient">Lens</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary border border-border px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 font-body">
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span className="truncate max-w-[80px] sm:max-w-[150px] inline-block">{user?.name}</span>
            </div>
            <Button
              id="logout-btn"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">
              Welcome back, {user?.name.split(" ")[0]}
            </h1>
            <p className="text-xs text-slate-550 mt-1 leading-relaxed">
              Track your behavioral traits, decision alignment, and cognitive growth patterns.
            </p>
          </div>

          {!activeIncomplete && (
            <Button
              id="new-assessment-btn"
              variant="gradient"
              onClick={startNewAssessment}
              className="gap-2 font-semibold text-xs shadow-md"
            >
              <Plus className="h-4 w-4" />
              Retake Assessment
            </Button>
          )}
        </div>

        {/* Core Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Active / Action Card */}
          <Card className="bg-white border-border flex flex-col justify-between p-6 h-[220px] shadow-soft">
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Brain className="h-5 w-5 text-indigo-500 animate-pulse" />
              </div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                {activeIncomplete ? "Assessment in Progress" : "Behavioral Intelligence"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-body">
                {activeIncomplete
                  ? "You have a pending assessment session. Resume to validate your remaining behavioral metrics."
                  : "Assessments calibrate your leadership style, resilience, values, and decision dynamics."}
              </p>
            </div>
            
            {activeIncomplete ? (
              <Button
                id="resume-assessment-btn"
                variant="gradient"
                onClick={() => router.push("/assessment")}
                className="w-full gap-2 font-semibold text-xs h-10 mt-4 shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Resume Assessment
              </Button>
            ) : (
              <Button
                id="start-assessment-btn"
                variant="secondary"
                onClick={startNewAssessment}
                className="w-full gap-2 font-semibold text-xs h-10 mt-4"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Start Assessment
              </Button>
            )}
          </Card>

          {/* Quick Metrics Card */}
          <Card className="bg-white border-border flex flex-col justify-between p-6 h-[220px] shadow-soft">
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="font-heading text-base font-bold text-slate-900">Latest Profile</h3>
              <p className="text-slate-500 text-xs font-body leading-relaxed">
                {latestReport
                  ? `Your primary archetype is evaluated as: "${latestReport.report_json.primaryArchetype}".`
                  : "Complete your first assessment to unlock your behavioral archetype profile."}
              </p>
            </div>

            {latestReport && (
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-border pt-3 mt-4 font-mono">
                <span>COMPLETED ASSESSMENTS</span>
                <span className="text-slate-700 font-bold">{completed.length} TOTAL</span>
              </div>
            )}
          </Card>

          {/* Integration Status Card */}
          <Card className="bg-white border-border flex flex-col justify-between p-6 h-[220px] shadow-soft">
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="font-heading text-base font-bold text-slate-900">Historical Sync</h3>
              <p className="text-slate-500 text-xs font-body leading-relaxed">
                PersonaLens safely persists profiles using database storage. Local results sync automatically.
              </p>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-border pt-3 mt-4 font-mono">
              <span>SYNC MODE</span>
              <span className="text-emerald-600 font-bold">ACTIVE STORAGE</span>
            </div>
          </Card>
        </div>

        {/* Latest Profile visualization Map */}
        {latestReport && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white border-border lg:col-span-1 p-6 flex flex-col justify-center min-h-[320px] shadow-soft">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-sm font-bold text-slate-900">Latest Dimension Radar</CardTitle>
                <CardDescription className="text-slate-450 text-[10px]">Your behavioral footprint dimensions</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex items-center justify-center">
                <RadarChartView traits={latestReport.report_json.finalTraits || {}} />
              </CardContent>
            </Card>

            <Card className="bg-white border-border lg:col-span-2 p-6 flex flex-col justify-between min-h-[320px] shadow-soft">
              <CardHeader className="p-0 pb-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">Latest Summary</span>
                <CardTitle className="text-lg font-bold text-slate-900 mt-1">
                  The {latestReport.report_json.primaryArchetype}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-0 flex-1 text-xs text-slate-600 leading-relaxed font-body space-y-4">
                <p className="text-sm leading-relaxed">{latestReport.report_json.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5 p-4 bg-secondary border border-border rounded-[16px]">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-600">Core Strengths</span>
                    <ul className="space-y-1 mt-1">
                      {latestReport.report_json.strengths.slice(0, 2).map((s: string, idx: number) => (
                        <li key={idx} className="text-slate-600 font-medium">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1.5 p-4 bg-secondary border border-border rounded-[16px]">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-amber-600">Blind Spots</span>
                    <ul className="space-y-1 mt-1">
                      {latestReport.report_json.blindSpots.slice(0, 2).map((s: string, idx: number) => (
                        <li key={idx} className="text-slate-600 font-medium">• {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-0 border-none mt-6">
                <Button
                  id="view-latest-report-btn"
                  variant="gradient"
                  onClick={() => router.push(`/report/${latestReport.id}`)}
                  className="gap-2 text-xs font-semibold h-10 w-full sm:w-auto shadow-md shadow-indigo-500/10"
                >
                  View Full Report
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* History List */}
        <div className="space-y-3">
          <h2 className="font-heading text-base font-bold text-slate-900 tracking-tight">Assessment History</h2>
          
          {completed.length === 0 ? (
            <Card className="bg-white border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center rounded-[24px]">
              <FileText className="h-8 w-8 text-slate-350 mb-2" />
              <p className="text-xs text-slate-500">No completed assessments found.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={startNewAssessment}
                className="mt-3 text-xs font-semibold"
              >
                Take Assessment
              </Button>
            </Card>
          ) : (
            <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-4 py-2">
              {completed.map((item) => (
                <div key={item.assessment.id} className="relative group">
                  {/* Timeline bullet indicator */}
                  <div className="absolute left-[-31px] top-4.5 h-3 w-3 rounded-full bg-white border-2 border-indigo-500 group-hover:bg-indigo-500 transition-colors" />
                  
                  <div
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-border hover:border-slate-300 rounded-[16px] gap-4 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {item.report?.report_json.primaryArchetype || "Behavioral Analysis"}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-450 mt-1 font-body">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(item.assessment.completed_at || "").toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="font-mono bg-indigo-50/50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100/30 text-[9px] font-bold">
                            Confidence: {Math.round(item.assessment.confidence_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      id={`view-report-btn-${item.assessment.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/report/${item.report?.id}`)}
                      className="gap-1.5 text-xs font-semibold h-9 w-full sm:w-auto"
                    >
                      View Report
                      <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
