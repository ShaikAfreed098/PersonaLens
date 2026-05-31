"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/utils/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Mail, User, Eye, Sparkles } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if already logged in
  useEffect(() => {
    async function checkAuth() {
      const user = await db.getCurrentUser();
      if (user) {
        router.push("/dashboard");
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await db.loginOrRegister(email, name);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background min-h-screen">
      {/* Dynamic Background Orbs */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[80px] pointer-events-none" />

      {/* Header Logo */}
      <div className="mb-8 flex flex-col items-center text-center z-10">
        <div className="h-12 w-12 rounded-xl bg-gradient-indigo-purple flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
          Persona<span className="text-gradient">Lens</span>
        </h1>
        <p className="text-xs text-slate-500 font-body mt-1">
          Adaptive Behavioral Intelligence
        </p>
      </div>

      {/* Card Form */}
      <Card className="w-full max-w-md glass-panel z-10" id="auth-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-heading text-slate-900">
            Create Profile
          </CardTitle>
          <CardDescription className="text-slate-500 font-body">
            Enter details to start assessments and track behavior over time.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 font-body">
            {error && (
              <div className="p-3 bg-red-50 border border-red-105 text-red-650 text-xs rounded-[16px] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label htmlFor="name-input" className="text-xs font-semibold text-slate-650">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="name-input"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-secondary rounded-[16px] border border-border text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email-input" className="text-xs font-semibold text-slate-650">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="email-input"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-secondary rounded-[16px] border border-border text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              id="submit-auth-btn"
              type="submit"
              variant="gradient"
              className="w-full h-11 shadow-md shadow-indigo-500/10"
              disabled={loading}
            >
              {loading ? "Initializing..." : "Begin Journey"}
            </Button>
            <p className="text-[10px] text-slate-400 text-center leading-relaxed max-w-[280px]">
              By proceeding, you agree to our privacy disclosure. Your assessment data is fully secure.
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
