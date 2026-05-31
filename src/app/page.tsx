"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db, UserProfile } from "@/utils/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Compass, BrainCircuit, Activity, Clock, ShieldAlert, ChevronRight, User } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadUser() {
      const u = await db.getCurrentUser();
      setUser(u);
    }
    loadUser();
  }, []);

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-background relative overflow-hidden font-body text-foreground">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-100px] right-[-100px] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-border z-10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-indigo-purple flex items-center justify-center shadow-md shadow-indigo-500/10">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-slate-900">
            Persona<span className="text-gradient">Lens</span>
          </span>
        </div>
        
        <div>
          {user ? (
            <Link href="/dashboard">
              <Button variant="secondary" className="gap-2 text-xs font-semibold">
                <User className="h-3.5 w-3.5 text-indigo-650" />
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button variant="outline" className="text-xs font-semibold">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col lg:flex-row gap-12 items-center z-10"
      >
        <div className="flex-1 flex flex-col space-y-6 text-left max-w-2xl">
          <div className="inline-flex self-start items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wide">
            <BrainCircuit className="h-3.5 w-3.5" />
            Adaptive Behavioral Intelligence
          </div>
          
          <h1 className="font-heading text-fluid-h1 font-bold tracking-tight text-slate-900 leading-[1.1]">
            Predict Decisions. <br />
            Understand <span className="text-gradient">Tendencies</span>.
          </h1>
          
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-body">
            PersonaLens is a state-of-the-art behavioral profiling system. Instead of fixed quizzes, our adaptive AI dynamically routes questions based on confidence scoring to analyze thinking, resilience, conflict, and decision patterns.
          </p>

          {/* Key Indicators */}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-border shadow-soft">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">Assessment Time</span>
                <span className="text-[11px] text-slate-400 font-medium">10-15 Minutes</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-border shadow-soft">
                <Activity className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">Assessment Engine</span>
                <span className="text-[11px] text-slate-400 font-medium">Adaptive Question Pool</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href={user ? "/assessment" : "/auth"} className="w-full sm:w-auto">
              <Button id="start-journey-btn" variant="gradient" className="w-full sm:w-auto gap-2 text-sm font-semibold tracking-wide shadow-md">
                Start Free Assessment
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#disclosure" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-sm font-semibold">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
          <Card className="border-border bg-white shadow-soft hover:translate-y-[-6px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:border-indigo-500/20 transition-all duration-300">
            <CardContent className="p-6 flex flex-col space-y-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-1">
                <Compass className="h-5 w-5 text-indigo-650" />
              </div>
              <h3 className="font-heading text-sm font-bold text-slate-900">Dynamic Routing</h3>
              <p className="text-xs text-slate-500 font-body leading-relaxed">
                No two assessments are identical. The AI dynamically maps questions based on confidence scoring and trait uncertainty.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-white shadow-soft hover:translate-y-[-6px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:border-purple-500/20 transition-all duration-300">
            <CardContent className="p-6 flex flex-col space-y-3">
              <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center mb-1">
                <BrainCircuit className="h-5 w-5 text-purple-655" />
              </div>
              <h3 className="font-heading text-sm font-bold text-slate-900">Gemini Synthesis</h3>
              <p className="text-xs text-slate-500 font-body leading-relaxed">
                Uses Google Gemini 2.5 Flash to synthesize a complete report, mapping archetypes, strengths, and blind spots.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* Psychological Disclosure Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        id="disclosure" 
        className="w-full max-w-7xl mx-auto px-6 py-12 border-t border-border z-10"
      >
        <div className="p-6 rounded-[24px] bg-amber-50/40 border border-amber-250/60 flex flex-col md:flex-row gap-6 items-start">
          <div className="h-10 w-10 rounded-xl bg-amber-100/50 flex items-center justify-center flex-shrink-0 border border-amber-200">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex flex-col space-y-2 text-left">
            <h2 className="font-heading text-sm font-bold text-slate-900">Privacy & Psychological Disclaimer</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-body">
              PersonaLens is an adaptive AI-driven assessment system that predicts behavioral tendencies and situational reactions. 
              <strong> PersonaLens is NOT a mental health diagnosis tool, clinical therapy platform, or fixed personality test.</strong> 
              All assessments and reports are intended for personal growth, leadership calibration, and self-awareness improvement. 
              We take privacy seriously: your answers are encrypted, stored securely in Supabase, and used solely to construct your private dashboard.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-border flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 z-10 gap-4">
        <p>&copy; {new Date().getFullYear()} PersonaLens. Built for Talent Intelligence.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-650 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-650 transition-colors">Terms of Use</a>
        </div>
      </footer>
    </main>
  );
}
