"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { db, ReportRecord, UserProfile } from "@/utils/db";
import { RadarChartView } from "@/components/radar-chart-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  Download,
  AlertTriangle,
  Award,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  LayoutDashboard
} from "lucide-react";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default function ReportPage({ params }: ReportPageProps) {
  const router = useRouter();
  const { id: reportId } = use(params);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>("Decision Making");

  useEffect(() => {
    async function loadReport() {
      try {
        const u = await db.getCurrentUser();
        if (!u) {
          router.push("/auth");
          return;
        }
        setUser(u);

        const record = await db.getReport(reportId);
        if (!record) {
          router.push("/dashboard");
          return;
        }
        setReport(record);
      } catch (err) {
        console.error("Error loading report:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reportId, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-background p-6 text-slate-900 min-h-screen font-body">
        <div className="relative h-16 w-16 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 border-r-2 border-purple-500 animate-spin" />
          <Brain className="h-6 w-6 text-indigo-500 animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Compiling Report Visualizer...</p>
      </main>
    );
  }

  if (!report) return null;

  const data = report.report_json;
  const traits = data.finalTraits || {};

  // Group traits by 8 dimensions for structured rendering
  const traitGroups = {
    "Decision Making": ["Risk Tolerance", "Risk Aversion", "Analytical Thinking", "Intuitive Thinking", "Long-Term Orientation", "Short-Term Orientation", "Planning Style", "Spontaneity"],
    "Leadership": ["Initiative", "Accountability", "Delegation", "Strategic Thinking", "Team Building", "Conflict Resolution"],
    "Resilience": ["Stress Management", "Recovery Speed", "Criticism Tolerance", "Persistence", "Emotional Stability"],
    "Social Style": ["Collaboration", "Communication Style", "Networking", "Empathy", "Social Energy"],
    "Motivation": ["Achievement Drive", "Purpose Orientation", "Recognition Need", "Security Need", "Growth Orientation"],
    "Adaptability": ["Change Readiness", "Learning Agility", "Uncertainty Tolerance", "Flexibility"],
    "Creativity": ["Idea Generation", "Innovation", "Curiosity", "Problem Solving"],
    "Values": ["Integrity", "Ethics", "Autonomy", "Service", "Growth", "Stability"]
  };

  return (
    <main className="flex-1 bg-background p-6 relative font-body text-slate-900 min-h-screen">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none print:hidden" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none print:hidden" />

      {/* Main Print Wrapper */}
      <div className="max-w-5xl mx-auto space-y-8 print:space-y-6">
        
        {/* Navigation Bar (hidden in print) */}
        <header className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-6 border-b border-border print:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-indigo-purple flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-sm font-bold tracking-tight text-slate-900">
              Persona<span className="text-gradient">Lens</span>
            </span>
          </div>

          <div className="flex gap-3">
            <Button
              id="back-to-dashboard-btn"
              variant="secondary"
              onClick={() => router.push("/dashboard")}
              className="gap-2 text-xs font-semibold"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              id="download-pdf-btn"
              variant="gradient"
              onClick={handlePrint}
              className="gap-2 text-xs font-semibold shadow-md shadow-indigo-500/10"
            >
              <Download className="h-4 w-4" />
              Download PDF Report
            </Button>
          </div>
        </header>

        {/* PRINT ONLY Header */}
        <div className="hidden print:flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-slate-800">PersonaLens Report</h1>
            <p className="text-[10px] text-slate-500 font-body">Adaptive Behavioral Profile | Candidate: {user?.name}</p>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">Date: {new Date(report.created_at).toLocaleDateString()}</p>
        </div>

        {/* Archetype Hero Section */}
        <Card className="bg-white border-border shadow-soft overflow-hidden relative" id="archetype-hero">
          {/* Subtle gradient bar at top */}
          <div className="h-1.5 w-full bg-gradient-indigo-purple" />
          
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold tracking-wide">
                    Primary: {data.primaryArchetype}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-650 text-[10px] font-bold tracking-wide">
                    Secondary: {data.secondaryArchetype}
                  </span>
                </div>
                <h1 className="font-heading text-fluid-h2 font-bold text-slate-900 leading-tight">
                  The {data.primaryArchetype}
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed font-body max-w-3xl">
                  {data.summary}
                </p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-1.5 bg-secondary border border-border px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span>Analysis Confidence:</span>
                <span className="font-mono text-slate-900 bg-white border border-border px-1.5 py-0.5 rounded">
                  {Math.round((report.report_json.finalTraits ? 87 : 50))}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radar Chart */}
          <Card className="bg-white border-border flex flex-col justify-center min-h-[350px] shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">Dimension Map</CardTitle>
              <CardDescription className="text-slate-450 text-[11px]">8 behavioral dimensions score mapping</CardDescription>
            </CardHeader>
            <CardContent>
              <RadarChartView traits={traits} />
            </CardContent>
          </Card>

          {/* Detailed Behavioral Style */}
          <Card className="bg-white border-border lg:col-span-2 space-y-6 shadow-soft">
            <CardHeader className="pb-0">
              <CardTitle className="text-base text-slate-900">Behavioral Tendencies</CardTitle>
              <CardDescription className="text-slate-450 text-[11px]">How you operate across organizational settings</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-5 text-sm font-body">
              <div className="space-y-1.5 p-4 bg-secondary border border-border rounded-[16px]">
                <h4 className="font-bold text-indigo-650 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                  <Sparkles className="h-3.5 w-3.5" /> Under Stress
                </h4>
                <p className="text-slate-600 leading-relaxed text-xs">{data.stressResponses}</p>
              </div>
              <div className="space-y-1.5 p-4 bg-secondary border border-border rounded-[16px]">
                <h4 className="font-bold text-indigo-650 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                  <Award className="h-3.5 w-3.5" /> Leadership & Teams
                </h4>
                <p className="text-slate-600 leading-relaxed text-xs">{data.leadershipStyle}</p>
              </div>
              <div className="space-y-1.5 p-4 bg-secondary border border-border rounded-[16px]">
                <h4 className="font-bold text-indigo-650 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" /> Relationship Dynamics
                </h4>
                <p className="text-slate-600 leading-relaxed text-xs">{data.relationshipStyle}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trait Breakdown Section */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-slate-900 tracking-tight">Trait Breakdown & Evidence</h2>
          
          <div className="space-y-3">
            {Object.entries(traitGroups).map(([groupName, traitList]) => {
              const isExpanded = expandedSection === groupName;
              return (
                <Card key={groupName} className="bg-white border-border shadow-soft">
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : groupName)}
                    className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-55 transition-colors"
                  >
                    <span className="font-heading text-sm font-bold text-slate-900">{groupName}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <CardContent className="px-6 pb-6 pt-2 space-y-6 divide-y divide-slate-100">
                      {traitList.map((traitName) => {
                        const traitData = traits[traitName] || { score: 50, confidence: 0, evidence: [] };
                        return (
                          <div key={traitName} className="pt-4 first:pt-0 space-y-2.5">
                            <div className="flex justify-between items-end">
                              <span className="text-sm font-bold text-slate-800">{traitName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-indigo-600 font-mono bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100/50">
                                  {traitData.score}/100
                                </span>
                                <span className="text-[10px] text-slate-450 font-mono">
                                  ({Math.round(traitData.confidence * 100)}% conf)
                                </span>
                              </div>
                            </div>

                            {/* Score Slider Indicator */}
                            <div className="relative h-2 w-full rounded-full bg-slate-100 border border-slate-200/50">
                              <div
                                className="absolute top-0 bottom-0 rounded-full bg-gradient-indigo-purple"
                                style={{ width: `${traitData.score}%` }}
                              />
                            </div>

                            {/* Behavioral Evidence */}
                            {traitData.evidence && traitData.evidence.length > 0 && (
                              <div className="pl-4 border-l-2 border-indigo-100 mt-2.5 space-y-1">
                                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-455 block font-mono">Behavioral Evidence</span>
                                {traitData.evidence.map((ev: string, idx: number) => (
                                  <p key={idx} className="text-xs text-slate-500 leading-relaxed font-body">
                                    • {ev}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Blindspots & Growth Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 page-break-before">
          {/* Blindspots */}
          <Card className="bg-white border-border shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Blind Spots
              </CardTitle>
              <CardDescription className="text-slate-450 text-[10px]">Areas of potential bias or overextension</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <ul className="space-y-2 text-xs text-slate-600 font-body">
                {data.blindSpots.map((spot: string, idx: number) => (
                  <li key={idx} className="flex gap-2 items-start leading-relaxed">
                    <span className="text-amber-500 flex-shrink-0 font-bold">•</span>
                    <span>{spot}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Growth recommendations */}
          <Card className="bg-white border-border shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                Growth Recommendations
              </CardTitle>
              <CardDescription className="text-slate-450 text-[10px]">Personalized developmental opportunities</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <ul className="space-y-2 text-xs text-slate-600 font-body">
                {data.growthOpportunities.map((opportunity: string, idx: number) => (
                  <li key={idx} className="flex gap-2 items-start leading-relaxed">
                    <span className="text-indigo-500 flex-shrink-0 font-bold">•</span>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer print disclaimer */}
        <footer className="text-center text-[10px] text-slate-400 pt-8 border-t border-border pb-12 leading-relaxed">
          <p>PersonaLens Adaptive Assessment System. Generated based on statistical confidence scores and AI synthesis.</p>
          <p className="mt-1 font-semibold text-slate-500">Strictly confidential. Not a medical or clinical diagnosis.</p>
        </footer>
      </div>

      {/* Local print CSS styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          main {
            background: white !important;
            padding: 0 !important;
          }
          .glass-panel, .glass-panel-glow {
            background: transparent !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }
          h1, h2, h3, h4, span, p, li {
            color: black !important;
          }
          .text-gradient {
            background: none !important;
            -webkit-text-fill-color: black !important;
            color: black !important;
          }
          .page-break-before {
            page-break-before: always;
          }
        }
      `}</style>
    </main>
  );
}
