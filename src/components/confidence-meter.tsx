import * as React from "react";
import { cn } from "@/utils/cn";
import { Sparkles, Brain, CheckCircle2 } from "lucide-react";

interface ConfidenceMeterProps {
  confidence: number; // 0.0 to 1.0
  completedCount: number;
}

export function ConfidenceMeter({ confidence, completedCount }: ConfidenceMeterProps) {
  const percent = Math.round(confidence * 100);

  // Helper text based on calibration status
  let statusText = "Calibrating Engine";
  let statusColor = "text-slate-400";
  let icon = <Brain className="h-4 w-4 animate-pulse text-indigo-500" />;
  let description = "Establishing initial behavioral markers.";

  if (completedCount <= 6) {
    statusText = `Calibration (${completedCount}/6)`;
    statusColor = "text-indigo-600";
    icon = <Brain className="h-4 w-4 animate-pulse text-indigo-500" />;
    description = "Calibration phase: forming your baseline profile.";
  } else if (percent < 50) {
    statusText = "Acquiring Behavioral Vectors";
    statusColor = "text-indigo-600";
    icon = <Sparkles className="h-4 w-4 text-indigo-500" />;
    description = "Adaptive engine targeting traits with lowest confidence.";
  } else if (percent < 75) {
    statusText = "Calibrating Dimensions";
    statusColor = "text-purple-650";
    icon = <Sparkles className="h-4 w-4 text-purple-500" />;
    description = "Resolving contradictory tendencies and scaling patterns.";
  } else if (percent < 85) {
    statusText = "Trait Validation";
    statusColor = "text-purple-600";
    icon = <CheckCircle2 className="h-4 w-4 text-purple-600" />;
    description = "Finalizing trait mappings. Approaching termination threshold.";
  } else {
    statusText = "High Psychological Confidence";
    statusColor = "text-[#22C55E]";
    icon = <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />;
    description = "Confidence threshold achieved. Profile ready for AI analysis.";
  }

  // Calculate circular stroke variables
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex items-center gap-6 p-5 rounded-[24px] bg-white border border-border shadow-soft font-body">
      <div className="relative flex items-center justify-center h-24 w-24 flex-shrink-0">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-indigo-500/5 blur-md pointer-events-none" />
        
        {/* SVG Circle Progress */}
        <svg className="h-full w-full transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className="stroke-slate-100"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Gradient Progress Ring */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="url(#confidenceGradient)"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
          {/* Gradients definition */}
          <defs>
            <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Text inside the ring */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 leading-none">
            {percent}%
          </span>
          <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
            Confidence
          </span>
        </div>
      </div>

      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <h4 className={cn("font-heading text-sm font-bold tracking-wide", statusColor)}>
            {statusText}
          </h4>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          {description}
        </p>
        <div className="text-[10px] text-slate-400">
          Termination threshold: <span className="text-slate-600 font-medium">85% confidence</span> or <span className="text-slate-600 font-medium">22 questions</span>
        </div>
      </div>
    </div>
  );
}
