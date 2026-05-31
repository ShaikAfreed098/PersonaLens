"use client";

import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TraitState } from "@/utils/trait-engine";

interface RadarChartViewProps {
  traits: TraitState;
}

export function RadarChartView({ traits }: RadarChartViewProps) {
  // Map our traits to the 8 core categories
  const categoriesMap = {
    "Decision Making": ["Risk Tolerance", "Analytical Thinking", "Long-Term Orientation", "Planning Style"],
    "Leadership": ["Initiative", "Accountability", "Delegation", "Strategic Thinking", "Team Building", "Conflict Resolution"],
    "Resilience": ["Stress Management", "Recovery Speed", "Criticism Tolerance", "Persistence", "Emotional Stability"],
    "Social Style": ["Collaboration", "Communication Style", "Networking", "Empathy", "Social Energy"],
    "Motivation": ["Achievement Drive", "Purpose Orientation", "Recognition Need", "Security Need", "Growth Orientation"],
    "Adaptability": ["Change Readiness", "Learning Agility", "Uncertainty Tolerance", "Flexibility"],
    "Creativity": ["Idea Generation", "Innovation", "Curiosity", "Problem Solving"],
    "Values": ["Integrity", "Ethics", "Autonomy", "Service", "Growth", "Stability"]
  };

  const data = Object.entries(categoriesMap).map(([category, traitList]) => {
    let totalScore = 0;
    let count = 0;
    
    for (const trait of traitList) {
      if (traits[trait]) {
        totalScore += traits[trait].score;
        count++;
      }
    }

    const averageScore = count > 0 ? Math.round(totalScore / count) : 50;

    return {
      subject: category,
      score: averageScore,
      fullMark: 100,
    };
  });

  return (
    <div className="h-[300px] w-full flex items-center justify-center font-body">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#4b5563", fontSize: 10, fontWeight: 600, fontFamily: "var(--font-body), sans-serif" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#9ca3af", fontSize: 8, fontFamily: "var(--font-mono), monospace" }}
            axisLine={false}
          />
          <Radar
            name="Behavioral Alignment"
            dataKey="score"
            stroke="#6366f1"
            fill="#8b5cf6"
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
